/* eslint-disable func-names */
/* eslint-disable no-var */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
/* global d3 */

import sort from './sorting';

// Data
let data;
let articleData;
let cleanedArticleData;
let timelineAnnotationList;
let paperData;
let cleanedPaperData;
let mergedData;
let annotations;
const parseDatePaper = d3.timeParse("%Y_%m_%d");
const parseDateArticle = d3.timeParse("%Y/%m/%d");

// Dimensions
// let margin = {'left':100, 'right':200, 'top':120, 'bottom':100};
let margin = {'left':10, 'right':10, 'top':10, 'bottom':10};
let width;
let height;
let yScale;
let rScale;

// DOM + joins
let $footer;
let $coverRight;
let $coverLeft;
let $introCopy1;
let $buttonArrowCover;
let $buttonArrowCopy;
let $buttonArrowBack;
let $buttonArrowBackIntro;

let simulation;
let $tooltip;

let $body;
let $svg;
let $timeline;
let $timelineAxis;
let $timelineCirclesG;
let $timelineAxisForeground
let $timelineAxisBackground;
let articlesJoin;
let $articleCells;
let $articleCircles;

// CONSTANTS
const RAD_PAPER = 20;
const RAD_ARTICLE = 5;
const COL_PAPER = '#559DB9'
const COL_ARTICLE = '#E17D7F'
const $scrollhint = d3.select('.scroll-hint');


// Tracking
let slideCount = 0

// Notes to self
// - left margin set to 2x that of right margin atm

function setNavigationFunctionality(){
    $buttonArrowCover
    .on('click', handleForwardClick)

    $buttonArrowCopy
        .on('click', handleForwardClick)

    $buttonArrowBack
        .on('click', handleBackClick)

    $buttonArrowBackIntro
        .on('click',handleBackClick)
}


function handleMouseEnter(d,i,n){
    const [xCoord,yCoord] = d3.mouse(this)
    const introHeight = d3.select('div.intro').node().offsetHeight
    const htmlContents = d.data.type==='article' ? `<p class='sci-title'>${d.data.hed_main}</p><p class='sci-body'>${d.data.abstract.slice(0,200)}...</p>`: `<p class='sci-title'>${d.data.hed_main}</p><p class='sci-author'>${d.data.author}</p><p class='sci-body'>${d.data.abstract.slice(0,200)}...</p>`

    d3.selectAll('.paper').classed('faded', true)
    d3.selectAll('.article').classed('faded', true)
    d3.select(this).classed('highlight', true)

    $tooltip
        .classed('hidden',false)
        .st('left',xCoord + 20)
        .st('top',yCoord)
        .st('max-width', ()=>{return width>600 ? width/4 : width/3})        
        .html(htmlContents)

}

function handleMouseLeave(d){
    $tooltip.classed('hidden',true)

    d3.selectAll('.paper').classed('faded', false)
    d3.selectAll('.article').classed('faded', false)
    d3.selectAll('.paper').classed('highlight', false)
    d3.selectAll('.article').classed('highlight', false)
}

function scrollTo(element) {
	window.scroll({
		behavior: 'smooth',
		left: 0,
		top: element.offsetTop
	});
}

function handleBackClick(){

  
  const el = d3.select('#content').node();
  scrollTo(el)

  setTimeout(function() {
    d3.select(`.timeline-intro`).classed('slide', false)
  }, 300)

  setTimeout(function() {
    $coverRight.classed('slide', false)
    $coverLeft.classed('slide', false)
    $scrollhint.classed('is-visible', true)
  }, 800)

  $buttonArrowCover.st('display','flex')
  d3.select(`.intro`).st('display','block')
  d3.select(`.timeline-intro`).st('display','block')
  d3.select('body').st('overflow', 'hidden')
  slideCount-=2
// Start of my commented code
//     if (slideCount === 1){

//         d3.select('.timeline-svg')
//         .st('display','none')
             
//         $coverRight.classed('slide', false)
//         $coverLeft.classed('slide', false)
//         d3.select(`.cover-container`).st('display','flex')   
//         d3.select(`.intro`).st('display','block')  
//         $footer.classed('hidden',true)
//         slideCount-=1        
        
//         // d3.select(`.slide-${slideCount}`).st('display','block')   
//         // d3.select(`.slide-${slideCount}`).classed('hidden',false)    
            
//     }
//     else if (slideCount === 2){
        
//         d3.select(`.timeline-svg`).st('display','none')
//         d3.select(`.timeline-intro`).st('display','block')
//         $footer.classed('hidden',true)
//         slideCount-=1 
//     }
//   END of my commented code

}

function handleForwardClick(){
    // console.log(slideCount)
    if (slideCount === 0){
        //d3.select('.timeline-svg').st('display','none')

        $coverRight.classed('slide', true)
        $coverLeft.classed('slide', true)
        //d3.select(`.intro`).st('display','none')
        slideCount+=1
    }
    else {
        $buttonArrowCover.st('display','none')
        d3.select(`.timeline-svg`).st('display','block')
        d3.select(`.timeline-intro`).classed('slide', 'true')
        d3.select(`.intro`).st('display','none')
        slideCount+=1
// //         START of my edited code
//         d3.select(`.timeline-intro`).st('display','none')
//         $footer.classed('hidden',false)
//         slideCount+=1 
//     }
//           END of my edited code

        d3.select('body').st('overflow', 'auto')
    }
}


function createSimulation(){

    function setForceX(type){
        // if (type==='article') return width/1.98
        // return width/2.02
        return width/2
    }

    simulation = d3.forceSimulation(mergedData)
    .force('x', d3.forceX(d=>setForceX(d.type)))
    .force('y', d3.forceY(d=> yScale(d.date)).strength(1))
    .force('collide', d3.forceCollide(function(d){
        return d.type==='article' ? 5 : 20
    }))
    .stop();

    for (var i = 0; i < 220; ++i) simulation.tick();

    console.log(mergedData)
}

function createTimelineAnnotations(mergedData){

    let widthWrap = d3.select('body').node().offsetWidth;

    function removeOverlap(title){
        if(title==='The end: no autism/vaccine link')return -60
        if(title==='In America...') return 200
        if(title==='Study retracted') return 100
        if(title==='Measles in US') return -100
        if(title==='Presidential debates') return 200
        return 0 
    }

    function setXOffset(i){
        if (widthWrap>600){
            return i%2 ? -200 : 100
        }
        else{
            return i%2 ? -25 : 21
        }
    }

    
    const annotationItemsOnly = mergedData.filter(item=>item.annotation);

    

    const annotationsFormatted= annotationItemsOnly.map((item, index)=>{
        
        const annotationObject = {}

        annotationObject['className'] = `anno-${item.type}`;

        annotationObject['note'] = {
            label: item.annotation,
            title: item.anno_title,
            bgPadding: {"top":0,"left":0,"right":0,"bottom":0},
            wrap: width > 600 ? widthWrap/4 : widthWrap/3.3     
        }

        annotationObject['data'] = {
            date: item.date,
            x: item.x,
            r: item.type ==='article'? RAD_ARTICLE : RAD_PAPER
        }

        annotationObject['dx'] = setXOffset(index);
        annotationObject['dy'] = removeOverlap(item.anno_title);


        return annotationObject
    })

    const annotationInsert1 = {}
    annotationInsert1['className']='anno-intro'
    annotationInsert1['note'] = {
        label: 'Here’s a timeline of New York Times articles that mention a relationship between vaccines and autism in the same story, pre-1998.',
        title: 'Before 1998',
        bgPadding: {"top":15,"left":10,"right":10,"bottom":10},
        wrap: 200       
    }
    annotationInsert1['data'] = {
        date: new Date('1990-01-01'),
        x: width/2,
        r: 0
    }
    annotationInsert1['dx'] = -10;
    annotationInsert1['dy'] = 0;


    annotationsFormatted.push(annotationInsert1)

    

    return annotationsFormatted
}


function generateAnnotations(){

    const type = d3.annotationCallout

    const parseTime = d3.timeParse("%d-%b-%y");
    const makeAnnotations = d3.annotation()
        .editMode(false)
        //also can set and override in the note.padding property
        //of the annotation object
        .notePadding(15)
        .type(type)
        //accessors & accessorsInverse not needed
        //if using x, y in annotations JSON
        .accessors({
        x: d => width/2,
        y: d => {
            
            return yScale(d.date)
        }
        })
        // .accessorsInverse({
        // date: d => timeFormat(x.invert(d.x)),
        // close: d => y.invert(d.y)
        // })
        .annotations(timelineAnnotationList)

    d3.select("svg.timeline-svg")
        .append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations)

    d3.selectAll('.anno-article')
        .select('.annotation-note-title')
        .st('fill', '#34A29E')

    d3.selectAll('.anno-paper')
        .select('.annotation-note-title')
        .st('fill', '#ff533d')

    d3.selectAll('.connector')
        .st('stroke', '#c9c9c9')

    d3.selectAll('.note-line')
        .st('stroke', '#c9c9c9')
}


function cleanArticleData(dirtyData){
    const addedPropertiesData = dirtyData.map(item=>({
        ...item,
        year: +item.formatted_pub_date.split('/')[0],
        month: +item.formatted_pub_date.split('/')[1],
        day: +item.formatted_pub_date.split('/')[2],
        date: new Date(parseDateArticle(item.formatted_pub_date)),
        yearMonth: `${item.formatted_pub_date.split('/')[0]}-${item.formatted_pub_date.split('/')[1]}`,        
    })).sort(sort.sortDatesYearMonth)


    const filteredPropertiesData = addedPropertiesData.filter(item=> (item.keywords !== '[]') && (item.type_of_material !== 'Correction') && (item.print_page !== '') && (item.source !== 'International Herald Tribune')&& (item.type === 'article'))

    // eslint-disable-next-line no-restricted-syntax
    for (const article of filteredPropertiesData){
        delete article.filename;
        delete article.keywords;
        delete article.multimedia;
        delete article.news_desk;
        delete article.section_name;
        delete article.snippet;
        delete article.subsection;
        delete article.type_of_material;
        delete article.uri;
        delete article.word_count;
        delete article.blog;
        // delete article.byline;
        delete article.headline;
        delete article.print_page;
        delete article.source;
        delete article.subsection_name;
      }

      return filteredPropertiesData;
}


function cleanPaperData(dirtyPaperData){

    

    const cleanedPaperData = dirtyPaperData.map(item=>({
        ...item,
        year: +item.pub_date.split('_')[0],
        month: +item.pub_date.split('_')[1],
        date: new Date(parseDatePaper(item.pub_date))
        // date: new Date(`${+item.pub_date.split('_')[0]}-${+(item.pub_date.split('_')[1]).replace(/^0+/, '')}-${+(item.pub_date.split('_')[2]).replace(/^0+/, '')}`)
    }))

    // cleanedPaperData.map(item=>{
        
        
    //     console.log(`pub_date field: ${item.pub_date}`)
    //     console.log(`date field ${item.date}`)
    //     console.log(`pub_date PARSED field: ${parseTimetest(item.pub_date)}`)
        
        
    // })

    return cleanedPaperData.filter(paper=>(paper.grouping==='aap_cochrane')||(paper.grouping==='original'))
}


function resize() {

    width = $body.node().offsetWidth;
    height = 6000

    $svg.at('width', width)
        .at('height', height)

    yScale = d3.scaleTime()
        .domain([(new Date(1990,1,1)),(new Date(2019,10,15))])
        .range([margin.top, height-margin.bottom]);

}


function setupDOM() { 
    $footer=d3.select('.pudding-footer')

    $coverRight = d3.select('.cover-right')
    $coverLeft = d3.select('.cover-left')
    $body = d3.select('body');
    $svg = d3.select('svg.timeline-svg')
    $timeline = $svg.append('g.timeline-g')
    $tooltip = d3.select('.tooltip')
    $buttonArrowCover = d3.select('.arrow-cover')
    $buttonArrowCopy = d3.select('.arrow-intro-text')
    $buttonArrowBack = d3.select('.arrow-up-svg')
    $buttonArrowBackIntro = d3.select('.arrow-up-intro')
}


function render() {

  generateAnnotations()

  $timeline
        .append('line.time-axis')
        .st('stroke','#000')
        .st('stroke-width', '0.5px')
        .st('opacity', 1)
        .at('x1', width/2)
        .at('y1', margin.top)
        .at('x2', width/2)
        .at('y2', height-margin.bottom);

    $timelineAxis =  $timeline.append('g.timeline-axis')
    $timelineCirclesG = $timelineAxis.append('g.timeline-circle-g')

    // console.log(mergedData)

    articlesJoin = $timelineCirclesG
        .selectAll('g.cells')
        .data(
            d3.voronoi()
            .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.top]])
            .x(d=> {
                // console.log(`margin left: ${margin.left}`)
                // console.log(`margin top: ${margin.top}`)
                // console.log(`margin bottom: ${margin.bottom}`)
                // console.log(`margin right: ${margin.right}`)
                // console.log(`width: ${width}`)
                // console.log(`height: ${height}`)
                // console.log(`extent: [[${-margin.left},${-margin.top}],[${width + margin.right},${height + margin.top}]]`)
            
                //  d.type==='paper'? console.log(d.x): console.log('article')


                 return (d.x< width + margin.right) && (d.x>-margin.left)? d.x : 0;
            })
            .y(d=> {
                // d.type==='paper'? console.log(d.y): console.log('article')

                return (d.y< height + margin.top) && (d.y>-margin.top)? d.y : 0;
            })
            .polygons(mergedData)
        )
        .enter()

    $articleCells = articlesJoin
        .append('g.cells')

        console.log(yScale.domain())
    
    $articleCircles = $articleCells
        .append('circle')
        .at('class', d=> d.data.type)
        .at('cx', d=>d.data.x)
        .at('cy', d=> d.data.y)
        .at('r', function(d){
            if (d.data.type==='article') return RAD_ARTICLE;
            return RAD_PAPER
        })
        .on('click', d => {
            d.data.type==='article' ? window.open(d.data.web_url) : window.open(d.data.link)
        })
        .on('mousemove',handleMouseEnter)
        .on('mouseleave',handleMouseLeave)


    $timelineAxisBackground =  $timelineAxis.append('g.timeline-axis-background')
    $timelineAxisForeground =  $timelineAxis.append('g.timeline-axis-foreground')

    $timelineAxisBackground
        .at('transform',`translate(${width/2},0)`)
        .call(
            d3.axisLeft(yScale)
            .ticks(d3.timeYear)
        )

    $timelineAxisForeground
        .at('transform',`translate(${width/2},0)`)
        .call(
            d3.axisLeft(yScale)
            .ticks(d3.timeYear)
        )

    $timelineAxisForeground
        .selectAll('.tick')
        .select('text')
        .st('fill', '#c9c9c9')

    $timelineAxis
        .selectAll('g.tick')
        .st('font-size', '16px')


    $timelineAxisBackground
        .selectAll('g.tick')
        .selectAll('text')
        .st('stroke','#282828')
        .st('stroke-width', '2')

    setNavigationFunctionality()
    
//     $svg.st('display','none')
//     $footer.classed('hidden',true)

    // Testing circle issues
    // const middle = d3.select('svg.timeline-svg').at('width')

    // d3.select('.timeline-svg')
    // .append('circle.test-circle')
    // .at('cx',+middle/2)
    // .at('cy',2400)
    // .at('r',500).st('fill','pink')
}

window.onscroll = function() {
	if ($scrollhint.classed('is-visible') === true) {
		$scrollhint.classed('is-visible', false)
	}
}

function init() {
    setupDOM();

  return new Promise((resolve, reject) => {

    const articlesFile = 'assets/data/nyt_vaccine_autism_monthly_v2.csv';
    const scienceFile = 'assets/data/science_track_combined.csv';

    const filesList = []

    filesList.push(articlesFile);
    filesList.push(scienceFile);


    d3.loadData(...filesList, (error, response) => {
      if (error) {
        reject(error);
      } else {
        articleData = response[0];
        paperData = response[1]

        cleanedArticleData = cleanArticleData(articleData)
        cleanedPaperData = cleanPaperData(paperData);
        mergedData = cleanedArticleData.concat(cleanedPaperData)
        timelineAnnotationList = createTimelineAnnotations(mergedData)

        
        resize();    
        createSimulation()        
        timelineAnnotationList.forEach((item,index)=>{
            const matchedItem = mergedData.filter(newItem=>newItem.date===item.data.date)[0];
            let originalXCoord= null;
            
            index%2 ? -200 : 100;

            if(matchedItem) {                
                const multiplier = index%2 ? -1 : 1;
                originalXCoord= matchedItem.x
                const xCoordWithRadius = matchedItem.type==='article'? (multiplier*RAD_ARTICLE + originalXCoord)  : (multiplier * RAD_PAPER+originalXCoord);                
                item.x = xCoordWithRadius;                
            }
            else{item.x=originalXCoord}            
        })

        render();
        
      }
    });
  });
}

export default { init, resize }
