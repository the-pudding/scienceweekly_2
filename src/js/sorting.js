
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

export default