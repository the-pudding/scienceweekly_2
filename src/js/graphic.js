/* eslint-disable func-names */
/* eslint-disable no-var */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
/* global d3 */

// Data
let data;
let articleData;
let cleanedArticleData;
let timelineAnnotationList;
let paperData;
let cleanedPaperData;
let mergedData;
let annotations;

// Dimensions
let margin = {'left':100, 'right':200, 'top':120, 'bottom':100};
let width;
let height;
let yScale;
let rScale;

// DOM + joins
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


// Tracking
let slideCount = 0

// Notes to self
// - left margin set to 2x that of right margin atm


function sortNumberStories(a,b){
    a=a.values.length;
    b=b.values.length;
    return b-a;
}

function sortDatesKey(a,b) {
    a = a.key.split('-');
    b = b.key.split('-');
    return new Date(a[0], a[1], 1) - new Date(b[0], b[1], 1)
}

function sortDatesYearMonth(a,b) {
    a = a.yearMonth.split('-');
    b = b.yearMonth.split('-');
    return new Date(a[0], a[1], 1) - new Date(b[0], b[1], 1)
}

function handleMouseEnter(d,i,n){
    const [xCoord,yCoord] = d3.mouse(this)
    const introHeight = d3.select('div.intro').node().offsetHeight

    d3.selectAll('.paper').classed('faded', true)
    d3.selectAll('.article').classed('faded', true)
    d3.select(this).classed('highlight', true)

    $tooltip
        .classed('hidden',false)
        .st('left',xCoord + 20)
        .st('top',yCoord)
        .st('max-width', ()=>{return width>600 ? width/3 : width/2})
        .html(`<p class='sci-title'>${d.data.hed_main}</p><p class='sci-author'>${d.data.author}</p><p class='sci-body'>${d.data.abstract.slice(0,200)}...</p>`)
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
  console.log(slideCount)
  const el = d3.select('#content').node();
  scrollTo(el)

  setTimeout(function() {
    d3.select(`.timeline-intro`).classed('slide', false)
  }, 300)

  setTimeout(function() {
    $coverRight.classed('slide', false)
    $coverLeft.classed('slide', false)
  }, 800)

  $buttonArrowCover.st('display','flex')
  d3.select(`.intro`).st('display','block')
  d3.select(`.timeline-intro`).st('display','block')
  d3.select('body').st('overflow', 'hidden')
  slideCount-=2
}

function handleForwardClick(){
    console.log(slideCount)
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

        d3.select('body').st('overflow', 'auto')
    }
}


function createSimulation(){

    function setForceX(type){
        if (type==='article') return width/1.98
        return width/2.02
    }

    simulation = d3.forceSimulation(mergedData)
    .force('x', d3.forceX(d=>setForceX(d.type)))
    .force('y', d3.forceY(d=> yScale(d.date)).strength(1))
    .force('collide', d3.forceCollide(function(d){
        return d.type==='article' ? 5 : 20
    }))
    .stop();

    for (var i = 0; i < 220; ++i) simulation.tick();

}

function createTimelineAnnotations(mergedData){
    const annotationItemsOnly = mergedData.filter(item=>item.annotation);

    const annotationsFormatted= annotationItemsOnly.map((item, index)=>{
        const annotationObject = {}

        annotationObject['className'] = `anno-${item.type}`;

        annotationObject['note'] = {
            label: item.annotation,
            title: item.anno_title,
            bgPadding: {"top":15,"left":10,"right":10,"bottom":10},
            wrap: 200
        }

        annotationObject['data'] = {
            date: item.date,
            x: item.x,
            r: item.type ==='article'? RAD_ARTICLE : RAD_PAPER
        }

        annotationObject['dx'] = index%2 ? -200 : 100;
        annotationObject['dy'] = index%2 ? 0 : 0;

        return annotationObject
    })

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
        x: d => (width/2),
        y: d => yScale(d.date)
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
        date: new Date(item.formatted_pub_date),
        yearMonth: `${item.formatted_pub_date.split('/')[0]}-${item.formatted_pub_date.split('/')[1]}`,
    })).sort(sortDatesYearMonth)

    const filteredPropertiesData = addedPropertiesData.filter(item=> (item.type_of_material !== 'Correction') && (item.print_page !== '') && (item.source !== 'International Herald Tribune')&& (item.type === 'article'))

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
        date: new Date(`${+item.pub_date.split('_')[0]}-${+item.pub_date.split('_')[1]}`)
    }))

    return cleanedPaperData.filter(paper=>(paper.grouping==='aap_cochrane')||(paper.grouping==='original'))
}


function mergeData(dataset1, dataset2){
    const combinedDataSet = []

    for (const item of dataset1)
        combinedDataSet.push(item)

    for (const item of dataset2)
        combinedDataSet.push(item)

    return combinedDataSet
}

function resize() {

    width = $body.node().offsetWidth;
    height = 6000

    $svg.at('width', width)
        .at('height', height)

    yScale = d3.scaleTime()
        .domain([(new Date('1990-01-01')),(new Date('2019-10-15'))])
        .range([margin.top, height-margin.bottom]);

}

function setupDOM() {
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

    articlesJoin = $timelineCirclesG
        .selectAll('g.cells')
        .data(
            d3.voronoi()
            .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.top]])
            .x(d=> d.x)
            .y(d=> d.y)
            .polygons(mergedData)
        )
        .enter()

    $articleCells = articlesJoin
        .append('g.cells')

    $articleCircles = $articleCells
        .append('circle')
        .at('class', d=> d.data.type)
        .at('cx', d=>d.data.x)
        .at('cy', d=>d.data.y)
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


    $buttonArrowCover
        .on('click', handleForwardClick)

    $buttonArrowCopy
        .on('click', handleForwardClick)

    $buttonArrowBack
        .on('click', handleBackClick)

    $buttonArrowBackIntro
        .on('click',handleBackClick)

}

function init() {
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
        mergedData = mergeData(cleanedArticleData,cleanedPaperData)
        timelineAnnotationList = createTimelineAnnotations(mergedData)

        setupDOM();
        resize();
        createSimulation()
        console.log(mergedData)
        render();
      }
    });
  });
}

export default { init, resize }
