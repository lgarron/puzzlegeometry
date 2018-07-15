var puzzlegeometry = require('./dist/puzzlegeometry.js') ;
var Quat = puzzlegeometry.Quat ;
var PlatonicGenerator = puzzlegeometry.PlatonicGenerator ;
var PuzzleGeometry = puzzlegeometry.PuzzleGeometry ;
var Perm = puzzlegeometry.Perm ;
var SchreierSims = puzzlegeometry.SchreierSims ;

//  Global epsilon; any difference less than this is ignored.

var eps = 1e-9 ;

var dosvg = false ;
var doss = false ;
var doksolve = false ;
var dogap = false ;
var docanon = false ;
if (typeof(process) !== 'undefined' &&
    process.argv && process.argv.length >= 3) {
   var desc = undefined ;
   var puzzleList = PuzzleGeometry.getpuzzles() ;
   var argp = 2 ;
   var optionlist = [] ;
   var showargs = true ;
   while (argp < process.argv.length && process.argv[argp][0] == '-') {
      var option = process.argv[argp++] ;
      if (option == "--verbose" || option == "-v") {
         optionlist.push('verbose', true) ;
      } else if (option == "--quiet" || option == "-q") {
         optionlist.push('quiet', true) ;
         showargs = false ;
      } else if (option == "--ksolve") {
         doksolve = true ;
      } else if (option == "--svg") {
         showargs = false ;
         optionlist.push('quiet', true) ;
         dosvg = true ;
      } else if (option == "--gap") {
         dogap = true ;
      } else if (option == "--ss") {
         doss = true ;
      } else if (option == "--canon") {
         docanon = true ;
      } else if (option == "--allmoves") {
         optionlist.push('allmoves', true) ;
      } else if (option == "--outerblockmoves") {
         optionlist.push('outerblockmoves', true) ;
      } else if (option == "--vertexmoves") {
         optionlist.push('vertexmoves', true) ;
      } else if (option == "--nocorners") {
         optionlist.push('cornersets', false) ;
      } else if (option == "--noedges") {
         optionlist.push('edgesets', false) ;
      } else if (option == "--nocenters") {
         optionlist.push('centersets', false) ;
      } else if (option == "--moves") {
         optionlist.push('movelist', process.argv[argp].split(",")) ;
         argp++ ;
      } else {
         throw "Bad option: " + option ;
      }
   }
   for (var i=0; i<puzzleList.length; i += 2)
      if (puzzleList[i+1] == process.argv[argp]) {
         desc = puzzleList[i] ;
         break ;
      }
   var createargs = [] ;
   if (showargs)
      console.log("# " + process.argv.join(" ")) ;
   if (desc != undefined) {
      createargs = PuzzleGeometry.parsedesc(desc) ;
      argp++ ;
   } else {
      var cuts = [] ;
      var cutarg = argp++ ;
      while (argp+1<process.argv.length && process.argv[argp].length == 1) {
         cuts.push([process.argv[argp], process.argv[argp+1]]) ;
         argp += 2 ;
      }
      createargs = [process.argv[cutarg], cuts] ;
   }
   var pg = new PuzzleGeometry(createargs[0], createargs[1], optionlist) ;
   pg.allstickers() ;
   pg.genperms() ;
   if (this.verbose)
      console.log("# Stickers " + pg.stickersperface + " cubies " +
               pg.cubies.length + " orbits " + pg.orbits +
                " shortedge " + pg.shortedge) ;
   if (argp < process.argv.length)
      throw "Unprocessed content at end of command line" ;
   if (dogap) {
      pg.writegap() ;
   } else if (doksolve) {
      console.log(pg.writeksolve()) ;
   } else if (dosvg) {
      console.log(pg.generatesvg()) ;
   } else if (doss) {
      var moves = pg.getcookedmoveperms() ;
      var g = moves.map(function(m){return m[0]}) ;
      SchreierSims.schreiersims(g) ;
   } else if (docanon) {
      pg.showcanon() ;
   }
}
