import { Quat } from "./Quat" ;
import { PlatonicGenerator } from "./PlatonicGenerator" ;
import { Perm } from "./Perm" ;

//  Now we have a geometry class that does the 3D goemetry to calculate
//  individual sticker information from a Platonic solid and a set of
//  cuts.  The cuts must have the same symmetry as the Platonic solid;
//  we even restrict them further to be either vertex-normal,
//  edge-normal, or face-parallel cuts.  Right now our constructor takes
//  a character solid indicator (one of c(ube), o(ctahedron), i(cosahedron),
//  t(etradron), or d(odecahedron), followed by an array of cuts.
//  Each cut is a character normal indicator that is either f(ace),
//  e(dge), or v(ertex), followed by a floating point value that gives
//  the depth of the cut where 0 is the center and 1 is the outside
//  border of the shape in that direction.

//  This is a heavyweight class with lots of members and construction
//  is slow.  Be gentle.

//  Everything except a very few methods should be considered private.

export class PuzzleGeometry {
   static eps:number = 1e-9 ;
   rotations: Array<Quat> ;    // all members of the rotation group
   baseplanerot: Array<Quat> ; // unique rotations of the baseplane
   baseplanes: Array<Quat> ;   // planes, corresponding to faces
   facenames: Array<any> ;     // face names
   faceplanes: any ;           // face planes
   edgenames: Array<any> ;     // edge names
   vertexnames: Array<any> ;   // vertexnames
   geonormals: Array<any> ;    // all geometric directions, with names and types
   moveplanes: Array<Quat> ;   // the planes that split moves
   moveplanesets: Array<any> ; // the move planes, in parallel sets
   movesetorders: Array<any> ; // the order of rotations for each move set
   movesetgeos: Array<any> ;   // geometric feature information for move sets
   faces: Array<Array<Quat>> ; // all the stickers
   basefacecount: number;      // number of base faces
   stickersperface: number;    // number of stickers per face
   cubies: Array<any> ;        // the cubies
   shortedge: number ;         // shortest edge
   vertexdistance: number ;    // vertex distance
   edgedistance: number ;      // edge distance
   orbits: number ;            // count of cubie orbits
   facetocubies: Array<any> ;  // map a face to a cubie index
   moverotations: Array<Array<Quat>> ; // move rotations
   cubiekey: any ;             // cubie locator
   facelisthash: any ;         // face list by key
   cubiesetnames: Array<any> ; // cubie set names
   cubieords: Array<number> ;  // the size of each orbit
   cubiesetnums: Array<number> ;
   cubieordnums: Array<number> ;
   orbitoris: Array<number> ;  // the orientation size of each orbit
   cubievaluemap: Array<number> ; // the map for identical cubies
   cubiesetcubies: Array<Array<number>> ; // cubies in each cubie set
   movesbyslice: Array<any> ;  // move as perms by slice
   cmovesbyslice: Array<any>=[] ; // cmoves as perms by slice
// options
   verbose: number=1 ;         // verbosity (console.log)
   allmoves: boolean = false ; // generate all slice moves in ksolve
   outerblockmoves: boolean ;  // generate outer block moves
   vertexmoves: boolean ;      // generate vertex moves
   movelist: any ;             // move list to generate
   cornersets: boolean = true ; // include corner sets
   centersets: boolean = true ; // include center sets
   edgesets: boolean = true ;   // include edge sets
   ksolvemovenames: Array<string> ; // move names from ksolve
//
// This is a description of the nets and the external names we give each
// face.  The names should be single-character upper-case alpahbetics so
// we can easily also name and distinguish vertices and edges, but we
// may change this in the future.  The nets consist of a list of lists.
// Each list gives the name of a face, and then the names of the
// faces connected to that face (in the net) in clockwise order.
// The length of each list should be one more than the number of
// edges in the regular polygon for that face.  All polygons must
// have the same number of edges.
// The first two faces in the first list must describe a horizontal edge
// that is at the bottom of a regular polygon.  The first two faces in
// every subsequent list for a given polytope must describe a edge that
// is directly connected in the net and has already been described (this
// sets the location and orientation of the polygon for that face.
// Any edge that is not directly connected in the net should be given
// the empty string as the other face.  All faces do not need to have
// a list starting with that face; just enough to describe the full
// connectivity of the net.
//
   static defaultnets:any = {
      4: // four faces: tetrahedron
      [
         ["F", "D", "L", "R"],
      ],
      6: // six faces: cube
      [
         ["F", "D", "L", "U", "R"],
         ["R", "F", "", "B", ""],
      ],
      8: // eight faces: octahedron
      [
         ["F", "D", "L", "R"],
         ["D", "F", "N", ""],
         ["N", "D", "", "B"],
         ["B", "N", "U", "M"],
      ],
      12: // twelve faces:  dodecahedron
      [
         ["U", "F", "", "", "", ""],
         ["F", "U", "R", "C", "A", "L"],
         ["R", "F", "", "", "E", ""],
         ["E", "R", "", "B", "", ""],
         ["B", "E", "G", "H", "I", "D"],
      ],
      20: // twenty faces: icosahedron
      [
         ["R", "C", "F", "E"],
         ["F", "R", "L", "U"],
         ["L", "F", "A", ""],
         ["E", "R", "G", "I"],
         ["I", "E", "S", "H"],
         ["S", "I", "J", "B"],
         ["B", "S", "K", "D"],
         ["K", "B", "M", "O"],
         ["O", "K", "P", "N"],
         ["P", "O", "Q", ""],
      ],
      } ;
   net:any = [] ;
   static defaultcolors:any = {
// the colors should use the same naming convention as the nets, above.
      4: { F: '#00ff00', D: '#ffff00', L: '#ff0000', R: '#0000ff', },
      6: { U: '#ffffff', F: '#00ff00', R: '#ff0000',
           D: '#ffff00', B: '#0000ff', L: '#ff8000', },
      8: { U: '#e085b9', F: '#080d99', R: '#c1e35c', D: '#22955e',
           B: '#9121ab', L: '#b27814', M: '#0d35ad', N: '#eb126b', },
      12: { U: '#b62d67', F: '#769500', R: '#88132b', C: '#d9af2f',
            A: '#fc74d7', L: '#d7b6f1', E: '#ee53b9', B: '#75f491',
            G: '#ab5947', H: '#ce5a57', I: '#f09e4f', D: '#0d24c0', },
      20: { R: '#db69f0', C: '#178fde', F: '#23238b', E: '#9cc726',
            L: '#2c212d', U: '#177fa7', A: '#e0de7f', G: '#2b57c0',
            I: '#41126b', S: '#4b8c28', H: '#7c098d', J: '#7fe7b4',
            B: '#85fb74', K: '#3f4bc3', D: '#0ff555', M: '#f1c2c8',
            O: '#58d340', P: '#c514f2', N: '#14494e', Q: '#8b1be1', },
   } ;
   colors:any = [] ;
   constructor(shape:string, cuts:Array<string>,
               optionlist:Array<any>|undefined) {
      if (optionlist != undefined) {
         if (optionlist.length % 2 != 0)
            throw "Odd length in option list?" ;
         for (var i=0; i<optionlist.length; i += 2) {
            if (optionlist[i] == "verbose")
               this.verbose++ ;
            else if (optionlist[i] == "quiet")
               this.verbose = 0 ;
            else if (optionlist[i] == "allmoves")
               this.allmoves = optionlist[i+1] ;
            else if (optionlist[i] == "outerblockmoves")
               this.outerblockmoves = optionlist[i+1] ;
            else if (optionlist[i] == "vertexmoves")
               this.vertexmoves = optionlist[i+1] ;
            else if (optionlist[i] == "cornersets")
               this.cornersets = optionlist[i+1] ;
            else if (optionlist[i] == "centersets")
               this.centersets = optionlist[i+1] ;
            else if (optionlist[i] == "edgesets")
               this.edgesets = optionlist[i+1] ;
            else
               throw "Bad option while processing option list " + optionlist[i] ;
         }
      }
      this.create(shape, cuts) ;
   }
   static findelement(a:Array<any>, p:Quat):number {
   // find something in facenames, vertexnames, edgenames
      for (var i=0; i<a.length; i++)
         if (a[i][0].dist(p) < PuzzleGeometry.eps)
            return i ;
      throw "Element not found" ;
   }
   create(shape:string, cuts:Array<any>):void {
   // create the shape, doing all the essential geometry
   // create only goes far enough to figure out how many stickers per
   // face, and what the short edge is.  If the short edge is too short,
   // we probably don't want to display or manipulate this one.  How
   // short is too short is hard to say.
      var that = this ;
      this.moveplanes = [] ;
      this.faces = [] ;
      this.cubies = [] ;
      var g = null ;
      switch(shape) {
         case 'c': g = PlatonicGenerator.cube() ; break ;
         case 'o': g = PlatonicGenerator.octahedron() ; break ;
         case 'i': g = PlatonicGenerator.icosahedron() ; break ;
         case 't': g = PlatonicGenerator.tetrahedron() ; break ;
         case 'd': g = PlatonicGenerator.dodecahedron() ; break ;
         default: throw "Bad shape argument: " + shape ;
      }
      this.rotations = PlatonicGenerator.closure(g) ;
      if (this.verbose) console.log("# Rotations: " + this.rotations.length) ;
      var baseplane = g[0] ;
      this.baseplanerot = PlatonicGenerator.uniqueplanes(baseplane, this.rotations) ;
      var baseplanes = this.baseplanerot.map(
                       function(_){ return baseplane.rotateplane(_) }) ;
      this.baseplanes = baseplanes ;
      this.basefacecount = baseplanes.length ;
      var net = PuzzleGeometry.defaultnets[baseplanes.length] ;
      this.net = net ;
      this.colors = PuzzleGeometry.defaultcolors[baseplanes.length] ;
      if (this.verbose) console.log("# Base planes: " + baseplanes.length) ;
      var baseface = PlatonicGenerator.getface(baseplanes) ;
      if (this.verbose) console.log("# Face vertices: " + baseface.length) ;
      var facenormal = baseplanes[0].makenormal() ;
      var edgenormal = baseface[0].sum(baseface[1]).makenormal() ;
      var vertexnormal = baseface[0].makenormal() ;
      var cutplanes = [] ;
      for (var i=0; i<cuts.length; i++) {
         var normal = null ;
         switch (cuts[i][0]) {
            case 'f': normal = facenormal ; break ;
            case 'v': normal = vertexnormal ; break ;
            case 'e': normal = edgenormal ; break ;
            default: throw "Bad cut argument: " + cuts[i][0] ;
         }
         cutplanes.push(normal.makecut(cuts[i][1])) ;
      }
      var boundary = new Quat(1, facenormal.b, facenormal.c, facenormal.d) ;
      if (this.verbose) console.log("# Boundary is " + boundary) ;
      var planerot = PlatonicGenerator.uniqueplanes(boundary, this.rotations) ;
      var planes = planerot.map(function(_){return boundary.rotateplane(_)}) ;
      var faces = [PlatonicGenerator.getface(planes)] ;
//
//   Determine names for edges, vertices, and planes.  Planes are defined
//   by the plane normal/distance; edges are defined by the midpoint;
//   vertices are defined by actual point.  In each case we define a name.
//   Note that edges have two potential names, and corners have n where
//   n planes meet at a vertex.  We arbitrarily choose the one that is
//   alphabetically first (and we will probably want to change this).
//
      var facenames = [] ;
      var faceplanes = [] ;
      var vertexnames:Array<any> = [] ;
      var edgenames:Array<any> = [] ;
      var edgesperface = faces[0].length ;
      function searchaddelement(a:Array<any>, p:Quat, name:any) {
         for (var i=0; i<a.length; i++)
            if (a[i][0].dist(p) < PuzzleGeometry.eps) {
               a[i].push(name) ;
               return ;
            }
         a.push([p, name]) ;
      }
      for (var i=0; i<this.baseplanerot.length; i++) {
         var face = this.baseplanerot[i].rotateface(faces[0]) ;
         for (var j=0; j<face.length; j++) {
            var jj = (j + 1) % face.length ;
            var midpoint = face[j].sum(face[jj]).smul(0.5) ;
            searchaddelement(edgenames, midpoint, i) ;
         }
      }
      var otherfaces = [] ;
      for (var i=0; i<this.baseplanerot.length; i++) {
         var face = this.baseplanerot[i].rotateface(faces[0]) ;
         var facelist = [] ;
         for (var j=0; j<face.length; j++) {
            var jj = (j + 1) % face.length ;
            var midpoint = face[j].sum(face[jj]).smul(0.5) ;
            var el = edgenames[PuzzleGeometry.findelement(edgenames, midpoint)] ;
            if (i == el[1])
               facelist.push(el[2]) ;
            else if (i == el[2]) 
               facelist.push(el[1]) ;
            else
               throw "Could not find edge" ;
         }
         otherfaces.push(facelist) ;
      }
      var facenametoindex:any = {} ;
      var faceindextoname:any = [] ;
      faceindextoname.push(net[0][0]) ;
      facenametoindex[net[0][0]] = 0 ;
      faceindextoname[otherfaces[0][0]] = net[0][1] ;
      facenametoindex[net[0][1]] = otherfaces[0][0] ;
      for (var i=0; i<net.length; i++) {
         var f0 = net[i][0] ;
         var fi = facenametoindex[f0] ;
         if (fi == undefined)
            throw "Bad edge description; first edge not connected" ;
         var ii = -1 ;
         for (var j=0; j<otherfaces[fi].length; j++) {
            var fn2 = faceindextoname[otherfaces[fi][j]] ;
            if (fn2 != undefined && fn2 == net[i][1]) {
               ii = j ;
               break ;
            }
         }
         if (ii < 0)
            throw "First element of a net not known" ;
         for (var j=2; j<net[i].length; j++) {
            if (net[i][j] == "")
               continue ;
            var of = otherfaces[fi][(j+ii-1)%edgesperface] ;
            var fn2 = faceindextoname[of] ;
            if (fn2 != undefined && fn2 != net[i][j])
               throw "Face mismatch in net" ;
            faceindextoname[of] = net[i][j] ;
            facenametoindex[net[i][j]] = of ;
         }
      }
      for (var i=0; i<this.baseplanerot.length; i++) {
         var face = this.baseplanerot[i].rotateface(faces[0]) ;
         var faceplane = boundary.rotateplane(this.baseplanerot[i]) ;
         var facename = faceindextoname[i] ;
         facenames.push([face, facename]) ;
         faceplanes.push([faceplane, facename]) ;
      }
      for (var i=0; i<this.baseplanerot.length; i++) {
         var face = this.baseplanerot[i].rotateface(faces[0]) ;
         var facename = faceindextoname[i] ;
         for (var j=0; j<face.length; j++) {
            var jj = (j + 1) % face.length ;
            var midpoint = face[j].sum(face[jj]).smul(0.5) ;
            var jjj = (j + 2) % face.length ;
            var midpoint2 = face[jj].sum(face[jjj]).smul(0.5) ;
            var e1 = PuzzleGeometry.findelement(edgenames, midpoint) ;
            var e2 = PuzzleGeometry.findelement(edgenames, midpoint2) ;
            searchaddelement(vertexnames, face[jj], [facename, e2, e1]) ;
         }
      }
      // fix the edge names; use alphabetical order
      for (var i=0; i<edgenames.length; i++) {
         if (edgenames[i].length != 3)
            throw "Bad length in edge names " + edgenames[i] ;
         var c1 = faceindextoname[edgenames[i][1]] ;
         var c2 = faceindextoname[edgenames[i][2]] ;
         if (c1 < c2)
            c1 = c1 + c2 ;
         else
            c1 = c2 + c1 ;
         edgenames[i] = [edgenames[i][0], c1] ;
      }
      // fix the vertex names; clockwise rotations; low face first.
      for (var i=0; i<vertexnames.length; i++) {
         if (vertexnames[i].length < 4)
            throw "Bad length in vertex names" ;
         var st = 1 ;
         for (var j=2; j<vertexnames[i].length; j++)
            if (vertexnames[i][j][0] < vertexnames[i][st][0])
               st = j ;
         var r = '' ;
         for (var j=1; j<vertexnames[i].length; j++) {
            r = r + vertexnames[i][st][0] ;
            for (var k=1; k<vertexnames[i].length; k++)
               if (vertexnames[i][st][2] == vertexnames[i][k][1]) {
                  st = k ;
                  break ;
               }
         }
         vertexnames[i] = [vertexnames[i][0], r] ;
      }
      var geonormals = [] ;
      for (var i=0; i<faceplanes.length; i++)
         geonormals.push(
                       [faceplanes[i][0].makenormal(), faceplanes[i][1], 'f']) ;
      for (var i=0; i<edgenames.length; i++)
         geonormals.push([edgenames[i][0].makenormal(), edgenames[i][1], 'e']) ;
      for (var i=0; i<vertexnames.length; i++)
         geonormals.push(
                     [vertexnames[i][0].makenormal(), vertexnames[i][1], 'v']) ;
      this.facenames = facenames ;
      this.faceplanes = faceplanes ;
      this.edgenames = edgenames ;
      this.vertexnames = vertexnames ;
      this.geonormals = geonormals ;
      var zero = new Quat(0, 0, 0, 0) ;
      this.edgedistance = faces[0][0].sum(faces[0][1]).smul(0.5).dist(zero) ;
      this.vertexdistance = faces[0][0].dist(zero) ;
      if (this.verbose)
         console.log("# Distances: face " + 1 + " edge " + this.edgedistance +
                  " vertex " + this.vertexdistance) ;
      // expand cutplanes by rotations.  We only work with one face here.
      for (var c=0; c<cutplanes.length; c++) {
         for (var i=0; i<this.rotations.length; i++) {
            var q = cutplanes[c].rotateplane(this.rotations[i]) ;
            var wasseen = false ;
            for (var j=0; j<this.moveplanes.length; j++) {
               if (q.sameplane(this.moveplanes[j])) {
                  wasseen = true ;
                  break ;
               }
            }
            if (!wasseen) {
               this.moveplanes.push(q) ;
               faces = q.cutfaces(faces) ;
            }
         }
      }
      this.faces = faces ;
      if (this.verbose) console.log("# Faces is now " + faces.length) ;
      this.stickersperface = faces.length ;
      //  Find and report the shortest edge in any of the faces.  If this
      //  is small the puzzle is probably not practical or displayable.
      var shortedge = 1e99 ;
      for (var i=0; i<faces.length; i++) {
         for (var j=0; j<faces[i].length; j++) {
            var k = (j + 1) % faces[i].length ;
            var t = faces[i][j].dist(faces[i][k]) ;
            if (t < shortedge)
               shortedge = t ;
         }
      }
      this.shortedge = shortedge ;
      if (this.verbose) console.log("# Short edge is " + shortedge) ;
   }
   keyface(face:Array<Quat>):string {
   // take a face and figure out the sides of each move plane
      var s = '' ;
      for (var i=0; i<this.moveplanesets.length; i++) {
         var t = 0 ;
         for (var j=0; j<this.moveplanesets[i].length; j++)
            if (this.moveplanesets[i][j].faceside(face) > 0)
               t++ ;
         s = s + ' ' + t ;
      }
      return s ;
   }
   findcubie(face:Array<Quat>):number {
      return this.facetocubies[this.findface(face)][0] ;
   }
   findface(face:Array<Quat>):number {
      var cm = Quat.centermassface(face) ;
      var key = this.keyface(face) ;
      for (var i=0; i<this.facelisthash[key].length; i++) {
         var face2 = this.facelisthash[key][i] ;
         if (Math.abs(cm.dist(
                     Quat.centermassface(this.faces[face2]))) < PuzzleGeometry.eps)
            return face2 ;
      }
      throw "Could not find face." ;
   }
   project2d(facen:number, edgen:number, targvec:Array<Quat>):any {
   // calculate geometry to map a particular edge of a particular
   //  face to a given 2D vector.  The face is given as an index into the
   //  facenames/baseplane arrays, and the edge is given as an offset into
   //  the vertices.
      var face = this.facenames[facen][0] ;
      var edgen2 = (edgen + 1) % face.length ;
      var plane = this.baseplanes[facen] ;
      var x0 = face[edgen2].sub(face[edgen]) ;
      var olen = x0.len() ;
      x0 = x0.normalize() ;
      var y0 = x0.cross(plane).normalize() ;
      var delta = targvec[1].sub(targvec[0]) ;
      var len = delta.len() / olen ;
      delta = delta.normalize() ;
      var cosr = delta.b ;
      var sinr = delta.c ;
      var x1 = x0.smul(cosr).sub(y0.smul(sinr)).smul(len) ;
      var y1 = y0.smul(cosr).sum(x0.smul(sinr)).smul(len) ;
      var off = new Quat(0, targvec[0].b - x1.dot(face[edgen]),
                        targvec[0].c - y1.dot(face[edgen]), 0) ;
      return [x1, y1, off] ;
   }
   allstickers():void {
   // next step is to calculate all the stickers and orbits
   // We do enough work here to display the cube on the screen.
   // take our newly split base face and expand it by the rotation matrix.
   // this generates our full set of "stickers".
      this.faces = Quat.expandfaces(this.baseplanerot, this.faces) ;
      if (this.verbose) console.log("# Total stickers is now " + this.faces.length) ;
      // Split moveplanes into a list of parallel planes.
      var moveplanesets = [] ;
      for (var i=0; i<this.moveplanes.length; i++) {
         var wasseen = false ;
         var q = this.moveplanes[i] ;
         var qnormal = q.makenormal() ;
         for (var j=0; j<moveplanesets.length; j++) {
            if (qnormal.sameplane(moveplanesets[j][0].makenormal())) {
               moveplanesets[j].push(q) ;
               wasseen = true ;
               break ;
            }
         }
         if (!wasseen)
            moveplanesets.push([q]) ;
      }
      // make the normals all face the same way in each set.
      for (var i=0; i<moveplanesets.length; i++) {
         var a:Array<Quat> = moveplanesets[i].map(
                              function(_) { return _.normalizeplane()}) ;
         var goodnormal = a[0].makenormal() ;
         for (var j=0; j<a.length; j++)
            if (a[j].makenormal().dist(goodnormal) > PuzzleGeometry.eps)
               a[j] = a[j].smul(-1) ;
         a.sort(function(a,b){return a.a-b.a;}) ;
         moveplanesets[i] = a ;
      }
      this.moveplanesets = moveplanesets ;
      var sizes = moveplanesets.map(function(_){return _.length}) ;
      if (this.verbose) console.log("# Move plane sets: " + sizes) ;
      // for each of the move planes, find the rotations that are relevant
      var moverotations:Array<Array<Quat>> = [] ;
      for (var i=0; i<moveplanesets.length; i++)
         moverotations.push([]) ;
      for (var i=0; i<this.rotations.length; i++) {
         var q:Quat = this.rotations[i] ;
         if (Math.abs(Math.abs(q.a)-1) < PuzzleGeometry.eps)
            continue ;
         var qnormal = q.makenormal() ;
         for (var j=0; j<moveplanesets.length; j++)
            if (qnormal.sameplane(moveplanesets[j][0].makenormal())) {
               moverotations[j].push(q) ;
               break ;
            }
      }
      this.moverotations = moverotations ;
      //  Sort the rotations by the angle of rotation.  A bit tricky because
      //  while the norms should be the same, they need not be.  So we start
      //  by making the norms the same, and then sorting.
      for (var i=0; i<moverotations.length; i++) {
         var a = moverotations[i] ;
         var goodnormal = a[0].makenormal() ;
         for (var j=0; j<a.length; j++)
            if (goodnormal.dist(a[j].makenormal()) > PuzzleGeometry.eps)
               a[j] = a[j].smul(-1) ;
         a.sort(function(a,b){return a.angle()-b.angle()}) ;
      }
      var sizes = moverotations.map(function(_){return 1+_.length}) ;
      this.movesetorders = sizes ;
      var movesetgeos = [] ;
      for (var i=0; i<moveplanesets.length; i++) {
         var p0 = moveplanesets[i][0].makenormal() ;
         var neg = null ;
         var pos = null ;
         for (var j=0; j<this.geonormals.length; j++) {
            var d = p0.dot(this.geonormals[j][0]) ;
            if (Math.abs(d-1) < PuzzleGeometry.eps) {
               pos = [this.geonormals[j][1], this.geonormals[j][2]] ;
            } else if (Math.abs(d+1) < PuzzleGeometry.eps) {
               neg = [this.geonormals[j][1], this.geonormals[j][2]] ;
            }
         }
         if (pos == null || neg == null)
            throw "Saw positive or negative sides as null" ;
         movesetgeos.push([pos[0], pos[1], neg[0], neg[1]]) ;
      }
      this.movesetgeos = movesetgeos ;
      //  Cubies are split by move plane sets.  For each cubie we can
      //  average its points to find a point on the interior of that
      //  cubie.  We can then check that point against all the move
      //  planes and from that derive a coordinate for the cubie.
      //  This also works for faces; no face should ever lie on a move
      //  plane.  This allows us to take a set of stickers and break
      //  them up into cubie sets.
      var cubiehash:any = {} ;
      var facelisthash:any = {} ;
      var cubiekey:any = {} ;
      var cubiekeys = [] ;
      var cubies:Array<Array<Array<Quat>>> = [] ;
      var faces = this.faces ;
      for (var i=0; i<faces.length; i++) {
         var face = faces[i] ;
         var s = this.keyface(face) ;
         if (!cubiehash[s]) {
            cubiekey[s] = cubies.length ;
            cubiekeys.push(s) ;
            cubiehash[s] = [] ;
            facelisthash[s] = [] ;
            cubies.push(cubiehash[s]) ;
         }
         facelisthash[s].push(i) ;
         cubiehash[s].push(face) ;
         //  If we find a core cubie, split it up into multiple cubies,
         //  because ksolve doesn't handle orientations that are not
         //  cyclic, and the rotation group of the core is not cyclic.
         if (facelisthash[s].length == this.basefacecount) {
            for (var suff=0; suff<this.basefacecount; suff++) {
               var s2 = s + " " + suff ;
               facelisthash[s2] = [facelisthash[s][suff]] ;
               cubiehash[s2] = [cubiehash[s][suff]] ;
               cubiekeys.push(s2) ;
               cubiekey[s2] = cubies.length ;
               cubies.push(cubiehash[s2]) ;
            }
            cubiehash[s] = [] ;
            cubies[cubiekey[s]] = [] ;
         }
      }
      this.cubiekey = cubiekey ;
      this.facelisthash = facelisthash ;
      if (this.verbose) console.log("# Cubies: " + Object.keys(cubiehash).length) ;
      //  Sort the faces around each corner so they are clockwise.  Only
      //  relevant for cubies that actually are corners (three or more
      //  faces).  In general cubies might have many faces; for icosohedrons
      //  there are five faces on the corner cubies.
      for (var k=0; k<cubies.length; k++) {
         var cubie = cubies[k] ;
         if (cubie.length < 3)
            continue ;
         if (cubie.length == this.basefacecount) // looks like core?  don't sort
            continue ;
         if (cubie.length > 5)
            throw "Bad math; too many faces on this cubie " + cubie.length ;
         var s = this.keyface(cubie[0]) ;
         var facelist = facelisthash[s] ;
         var cm = cubie.map(
                       function(_){return Quat.centermassface(_)}) ;
         var cmall = Quat.centermassface(cm) ;
         for (var looplimit=0; ; looplimit++) {
            var changed = false ;
            for (var i=0; i<cubie.length; i++) {
               var j = (i + 1) % cubie.length ;
               var ttt = cmall.dot(cm[i].cross(cm[j])) ;
               if (cmall.dot(cm[i].cross(cm[j])) < 0) {
                  var t = cubie[i] ;
                  cubie[i] = cubie[j] ;
                  cubie[j] = t ;
                  var u = cm[i] ;
                  cm[i] = cm[j] ;
                  cm[j] = u ;
                  var v = facelist[i] ;
                  facelist[i] = facelist[j] ;
                  facelist[j] = v ;
                  changed = true ;
               }
            }
            if (!changed)
               break ;
            if (looplimit > 1000)
               throw("Bad epsilon math; too close to border") ;
         }
      }
      // make the first face of each cubie be the least.
      // when we start permitting multiple faces to be the same color,
      // this code will need to be improved to properly sort RRG vs
      // RGR.
      for (var k=0; k<cubies.length; k++) {
         var cubie = cubies[k] ;
         if (cubie.length < 2)
            continue ;
         var mini = 0 ;
         var minf = this.findface(cubie[mini]) ;
         for (var i=1; i<cubie.length; i++) {
            var temp = this.findface(cubie[i]) ;
            if (temp < minf) {
               mini = i ;
               minf = temp ;
            }
         }
         if (mini != 0) {
            var ocubie = cubie.slice() ;
            for (var i=0; i<cubie.length; i++)
               cubie[i] = ocubie[(mini+i)%cubie.length] ;
         }
      }
      this.cubies = cubies ;
      //  Build an array that takes each face to a cubie ordinal and a
      //  face number.
      var facetocubies = [] ;
      for (var i=0; i<cubies.length; i++) {
         var facelist = facelisthash[cubiekeys[i]] ;
         for (var j=0; j<facelist.length; j++) {
            facetocubies[facelist[j]] = [i, j] ;
         }
      }
      this.facetocubies = facetocubies ;
      //  Calculate the orbits of each cubie.  Assumes we do all moves.
      //  Also calculates which cubies are identical.
      var typenames = ['?', 'CENTER', 'EDGE', 'CORNER', 'C4RNER', 'C5RNER'] ;
      var cubiesetnames = [] ;
      var cubietypecounts = [0, 0, 0, 0, 0, 0] ;
      var orbitoris = [] ;
      var seen = [] ;
      var cubiesetnum = 0 ;
      var cubiesetnums = [] ;
      var cubieordnums = [] ;
      var cubieords = [] ;
      var cubiesetnumhash = {} ;
      var cubievaluemap = [] ;
      var that = this ;
      // Later we will make this smarter to use a get color for face function
      // so we support puzzles with multiple faces the same color
      function getcolorkey(cubienum:number):string {
         var divid = that.stickersperface ;
         return cubies[cubienum].map(
            function(_){return Math.floor(that.findface(_)/divid)}).join(" ") ;
      }
      var cubiesetcubies:any = [] ;
      for (var i=0; i<cubies.length; i++) {
         if (seen[i])
            continue ;
         var cubie = cubies[i] ;
         if (cubie.length == 0)
            continue ;
         var cubiekeymap:any = {} ;
         var cubievalueid = 0 ;
         cubieords.push(0) ;
         cubiesetcubies.push([]) ;
         var facecnt = cubie.length ;
         var typectr = cubietypecounts[facecnt]++ ;
         var typename = typenames[facecnt] ;
         if (typename == undefined || facecnt == this.basefacecount)
            typename = "CORE" ;
         typename = typename + (typectr == 0 ? '' : (typectr+1)) ;
         cubiesetnames[cubiesetnum] = typename ;
         orbitoris[cubiesetnum] = facecnt ;
         var queue = [i] ;
         var qg = 0 ;
         seen[i] = true ;
         while (qg < queue.length) {
            var cind = queue[qg++] ;
            var cubiecolorkey = getcolorkey(cind) ;
            if (cubiekeymap[cubiecolorkey] == undefined)
               cubiekeymap[cubiecolorkey] = cubievalueid++ ;
            cubievaluemap[cind] = cubiekeymap[cubiecolorkey] ;
            cubiesetnums[cind] = cubiesetnum ;
            cubiesetcubies[cubiesetnum].push(cind) ;
            cubieordnums[cind] = cubieords[cubiesetnum]++ ;
            for (var j=0; j<moverotations.length; j++)
               for (var k=0; k<moverotations[j].length; k++) {
                  var tq = 
                  this.findcubie(moverotations[j][k].rotateface(cubies[cind][0])) ;
                  if (!seen[tq]) {
                     queue.push(tq) ;
                     seen[tq] = true ;
                  }
               }
         }
         cubiesetnum++ ;
      }
      this.orbits = cubieords.length ;
      this.cubiesetnums = cubiesetnums ;
      this.cubieordnums = cubieordnums ;
      this.cubiesetnames = cubiesetnames ;
      this.cubieords = cubieords ;
      this.orbitoris = orbitoris ;
      this.cubievaluemap = cubievaluemap ;
      this.cubiesetcubies = cubiesetcubies ;
      // show the orbits
      if (this.verbose) console.log("# Cubie orbit sizes " + cubieords) ;
   }
   genperms():void { // generate permutations for moves
      if (this.cmovesbyslice.length > 0) // did this already?
         return ;
      var mvcnt = 0 ;
      var movesbyslice = [] ;
      var cmovesbyslice = [] ;
      for (var k=0; k<this.moveplanesets.length; k++) {
         var moveplaneset = this.moveplanesets[k] ;
         var slicenum = [] ;
         var slicecnts = [] ;
         for (var i=0; i<this.faces.length; i++) {
            var face = this.faces[i] ;
            var t = 0 ;
            for (var j=0; j<moveplaneset.length; j++) {
               if (moveplaneset[j].faceside(face) < 0)
                  t++ ;
            }
            slicenum.push(t) ;
            while (slicecnts.length <= t)
               slicecnts.push(0) ;
            slicecnts[t]++ ;
         }
         var axismoves = [] ;
         var axiscmoves = [] ;
         for (var sc=0; sc<slicecnts.length; sc++) {
            var mv = '' ;
            var slicemoves = [] ;
            var slicecmoves = [] ;
            var cubiedone = [] ;
            for (var i=0; i<this.faces.length; i++) {
               if (slicenum[i] != sc)
                  continue ;
               var a = [i] ;
               var b = this.facetocubies[i].slice() ;
               var face = this.faces[i] ;
               var fi2 = i ;
               while (true) {
                  slicenum[fi2] = -1 ;
                  var face2 = this.moverotations[k][0].rotateface(face) ;
                  fi2 = this.findface(face2) ;
                  if (slicenum[fi2] < 0)
                     break ;
                  if (slicenum[fi2] != sc)
                     throw "Bad movement?" ;
                  a.push(fi2) ;
                  var c = this.facetocubies[fi2] ;
                  b.push(c[0], c[1]) ;
                  face = face2 ;
               }
               if (a.length > 1)
                  slicemoves.push(a) ;
               if (b.length > 2 && !cubiedone[b[0]])
                  slicecmoves.push(b) ;
               for (var j=0; j<b.length; j += 2)
                  cubiedone[b[j]] = true ;
            }
            axismoves.push(slicemoves) ;
            axiscmoves.push(slicecmoves) ;
         }
         movesbyslice.push(axismoves) ;
         cmovesbyslice.push(axiscmoves) ;
      }
      this.movesbyslice = movesbyslice ;
      this.cmovesbyslice = cmovesbyslice ;
   }
   getfaces():Array<Array<Array<number>>> { // get the faces for 3d.
      return this.faces.map(
              function(_){return _.map(function(_){return [_.b,_.c,_.d]})}) ;
   }
   getboundarygeometry():any { // get the boundary geometry
      return {
         baseplanes: this.baseplanes,
         facenames: this.facenames,
         faceplanes: this.faceplanes,
         vertexnames: this.vertexnames,
         edgenames: this.edgenames,
         geonormals: this.geonormals,
      } ;
   }
   getmovesets(k:number):any {
   // get the move sets we support based on slices
   // for even values we omit the middle "slice".  This isn't perfect
   // but it is what we do for now.
      var slices = this.moveplanesets[k].length ;
      if (slices > 30)
         throw "Too many slices for getmovesets bitmasks" ;
      var r = [] ;
      if (this.vertexmoves && !this.allmoves) {
         var msg = this.movesetgeos[k] ;
         if (msg[1] != msg[3]) {
            for (var i=0; i<slices; i++) {
               if (msg[1] != 'v') {
                  if (this.outerblockmoves)
                     r.push((2 << slices) - (2 << i)) ;
                  else
                     r.push(2<<i) ;
               } else {
                  if (this.outerblockmoves)
                     r.push((2<<i)-1) ;
                  else
                     r.push(1<<i) ;
               }
            }
            return r ;
         }
      }
      for (var i=0; i<=slices; i++) {
         if (!this.allmoves && i + i == slices)
            continue ;
         if (this.outerblockmoves) {
            if (i + i > slices)
               r.push((2 << slices) - (1 << i)) ;
            else
               r.push((2<<i)-1) ;
         } else
            r.push(1<<i) ;
      }
      return r ;
   }
   skipbyori(cubie:number):boolean {
      var ori = this.cubies[cubie].length ;
      return ((ori == 1 && !this.centersets) ||
              (ori == 2 && !this.edgesets) ||
              (ori > 2 && !this.cornersets)) ;
   }
   skipcubie(set:Array<number>):boolean {
      if (set.length == 0)
         return true ;
      var fi = set[0] ;
      return this.skipbyori(fi) ;
   }
   skipset(set:Array<number>):boolean {
      if (set.length == 0)
         return true ;
      var fi = set[0] ;
      return this.skipbyori(this.facetocubies[fi][0]) ;
   }
   writegap():void { // write out a gap set of generators
      var perms = [] ;
      var movenum = 0 ;
      for (var k=0; k<this.moveplanesets.length; k++) {
         var moveplaneset = this.moveplanesets[k] ;
         var slices = moveplaneset.length ;
         var moveset = this.getmovesets(k) ;
         for (var i=0; i<moveset.length; i++) {
            var order = -1 ;
            var move = '' ;
            var movebits = moveset[i] ;
            var axismoves = this.movesbyslice[k] ;
            for (var ii=0; ii<axismoves.length; ii++) {
               if (((movebits >> ii) & 1) == 0)
                  continue ;
               var slicemoves = axismoves[ii] ;
               for (var j=0; j<slicemoves.length; j++) {
                  if (this.skipset(slicemoves[j]))
                     continue ;
                  var mperm = slicemoves[j].map((x:number)=>x+1) ;
                  order = mperm.length ;
                  move = move + "(" + mperm.join(",") + ")" ;
               }
            }
            if (order > 0) {
               var movename = 'M'+movenum ;
               console.log(movename+':='+move+";") ;
               perms.push(movename) ;
               for (var j=2; j<order; j++) {
                  perms.push(movename + '^' + j) ;
               }
               movenum++ ;
            }
         }
      }
      console.log("Gen:=[") ;
      console.log(perms.join(',')) ;
      console.log("];") ;
   }
   getmovename(geo:any, bits:number, slices:number):any {
   // generate a move name based on bits, slice, and geo
   // if the move name is from the opposite face, say so.
   // find the face that's turned.
      var nbits = 0 ;
      var inverted = 0 ;
      for (var i=0; i<=slices; i++)
         if ((bits >> i) & 1)
            nbits |= 1<<(slices-i) ;
      if (nbits < bits) { // flip if most of the move is on the other side
         geo = [geo[2], geo[3], geo[0], geo[1]] ;
         bits = nbits ;
         inverted++ ;
      }
      var movename = geo[0] ;
      var hibit = 0 ;
      while (bits >> (1 + hibit))
         hibit++ ;
      if (bits == (1 << hibit)) {
         if (hibit > 0)
            movename = (hibit + 1) + movename ;
      } else if (bits == ((2 << hibit) - 1)) {
         movename = movename.toLowerCase() ;
         if (hibit > 1)
            movename = (hibit + 1) + movename ;
      } else
         throw "We only support slice and outer block moves right now. " + bits ;
      return [movename, inverted] ;
   }
   writeksolve(name:string, fortwisty:boolean):string {
   // write ksolve; mirrored off original q.pl
      var setmoves = [] ;
      var result = [] ;
      var movenames = [] ;
      if (!name)
         name = "CustomPuzzle" ;
      result.push("Name " + name) ;
      for (var k=0; k<this.moveplanesets.length; k++) {
         var moveplaneset = this.moveplanesets[k] ;
         var slices = moveplaneset.length ;
         var moveset = this.getmovesets(k) ;
         var allbits = 0 ;
         for (var i=0; i<moveset.length; i++)
            allbits |= moveset[i] ;
         if (moveset.length == 0)
            throw "Bad moveset length in writeksolve" ;
         var axiscmoves = this.cmovesbyslice[k] ;
         for (var i=0; i<axiscmoves.length; i++) {
            if (((allbits >> i) & 1) == 0)
               continue ;
            var slicecmoves = axiscmoves[i] ;
            for (var j=0; j<slicecmoves.length; j++) {
               if (this.skipcubie(slicecmoves[j]))
                  continue ;
               var ind = this.cubiesetnums[slicecmoves[j][0]] ;
               if (!setmoves[ind])
                  setmoves[ind] = 1 ;
               else
                  setmoves[ind]++ ;
            }
         }
      }
      for (var i=0; i<this.cubiesetnames.length; i++) {
         if (!setmoves[i])
            continue ;
         result.push("Set " + this.cubiesetnames[i] + " " + this.cubieords[i] +
                     " " + this.orbitoris[i]) ;
      }
      result.push("") ;
      result.push("Solved") ;
      for (var i=0; i<this.cubiesetnames.length; i++) {
         if (!setmoves[i])
            continue ;
         result.push(this.cubiesetnames[i]) ;
         var p = [] ;
         for (var j=1; j<=this.cubieords[i]; j++)
            if (fortwisty)
               p.push(j) ;
            else {
               var cubie = this.cubiesetcubies[i][j-1] ;
               p.push(1+this.cubievaluemap[cubie]) ;
            }
         result.push(p.join(" ")) ;
      }
      result.push("End") ;
      result.push("") ;
      for (var k=0; k<this.moveplanesets.length; k++) {
         var moveplaneset = this.moveplanesets[k] ;
         var slices = moveplaneset.length ;
         var moveset = this.getmovesets(k) ;
         var movesetgeo = this.movesetgeos[k] ;
         for (var i=0; i<moveset.length; i++) {
            var movebits = moveset[i] ;
            var mna = this.getmovename(movesetgeo, movebits, slices) ;
            var movename = mna[0] ;
            var inverted = mna[1] ;
            var movedat = [] ;
            movedat.push("Move " + movename) ;
            movenames.push(movename) ;
            var perms = [] ;
            var oris = [] ;
            for (var ii=0; ii<this.cubiesetnames.length; ii++) {
               var p = [] ;
               for (var kk=0; kk<this.cubieords[ii]; kk++)
                  p.push(kk) ;
               perms.push(p) ;
               var o = [] ;
               for (var kk=0; kk<this.cubieords[ii]; kk++)
                  o.push(0) ;
               oris.push(o) ;
            }
            var axiscmoves = this.cmovesbyslice[k] ;
            for (var m=0; m<axiscmoves.length; m++) {
               if (((movebits >> m) & 1) == 0)
                  continue ;
               var slicecmoves = axiscmoves[m] ;
               for (var j=0; j<slicecmoves.length; j++) {
                  var mperm = slicecmoves[j].slice() ;
                  var setnum = this.cubiesetnums[mperm[0]] ;
                  for (var ii=0; ii<mperm.length; ii += 2)
                     mperm[ii] = this.cubieordnums[mperm[ii]] ;
                  var inc = 2 ;
                  var oinc = 3 ;
                  if (inverted) {
                     inc = mperm.length - 2 ;
                     oinc = mperm.length - 1 ;
                  }
                  for (var ii=0; ii<mperm.length; ii += 2) {
                     perms[setnum][mperm[(ii+inc)%mperm.length]] = mperm[ii] ;
                     oris[setnum][mperm[ii]] =
                            (mperm[(ii+oinc)%mperm.length] -
                             mperm[(ii+1)%mperm.length] +
                             this.orbitoris[setnum]) % this.orbitoris[setnum] ;
                  }
               }
            }
            for (var ii=0; ii<this.cubiesetnames.length; ii++) {
               if (!setmoves[ii])
                  continue ;
               var needed = false ;
               for (var kk=0; kk<perms[ii].length; kk++)
                  if (perms[ii][kk] != kk) {
                     needed = true ;
                     break ;
                  }
               var needori = fortwisty ;
               if (this.orbitoris[ii] > 1)
                  for (var kk=0; kk<oris[ii].length; kk++)
                     if (oris[ii][kk] != 0) {
                        needori = true ;
                        break ;
                     }
               if (!needed && !needori)
                  continue ;
               movedat.push(this.cubiesetnames[ii]) ;
               var r = [] ;
               for (var kk=0; kk<perms[ii].length; kk++)
                  r.push(perms[ii][kk]+1) ;
               movedat.push(r.join(" ")) ;
               if (this.orbitoris[ii] > 1 && needori)
                  movedat.push(oris[ii].join(" ")) ;
            }
            movedat.push("End") ;
            if (movedat.length > 2) {
               for (var ii=0; ii<movedat.length; ii++)
                  result.push(movedat[ii]) ;
               result.push("") ;
            }
         }
      }
      this.ksolvemovenames = movenames ; // hack!
      return result.join("\n") ;
   }
   getmoveperms():any {
   // get basic move perms in an array, along with orders and
   // geometry.
      var r = [] ;
      for (var k=0; k<this.moveplanesets.length; k++) {
         var moveplaneset = this.moveplanesets[k] ;
         var slices = moveplaneset.length ;
         for (var i=0; i<=slices; i++) {
            var perm = [] ;
            for (var j=0; j<this.faces.length; j++)
               perm[j] = j ;
            var slicemoves = this.movesbyslice[k][i] ;
            for (var j=0; j<slicemoves.length; j++) {
               if (this.skipset(slicemoves[j]))
                  continue ;
               var mperm = slicemoves[j] ;
               for (var ii=0; ii<mperm.length; ii++) {
                  var jj = (ii + 1) % mperm.length ;
                  perm[mperm[jj]] = mperm[ii] ;
               }
            }
            r.push([new Perm(perm), i, slices, this.movesetgeos[k],
                    this.movesetorders[k]]) ;
         }
      }
      return r ;
   }
   getcookedmoveperms():any {
   // get moves that matter, with appropriate directions
   // for instance, for the 3x3, only return face moves, and fix the ones
   // at the extremes so they are to the right.
      var m = this.getmoveperms() ;
      var r = [] ;
      for (var i=0; i<m.length; i++) {
         if (!this.allmoves && m[i][1] * 2 == m[i][2])
            continue ;
         if (m[i][1] * 2 > m[i][2]) {
            r.push([m[i][0].inv(), m[i][2]-m[i][1],
                    m[i][2], m[i][3][2], m[i][3][3], m[i][4]]) ;
         } else {
            r.push([m[i][0], m[i][1], m[i][2], m[i][3][0], m[i][3][1], m[i][4]]) ;
         }
      }
      return r ;
   }
   showcanon():void { // show information for canonical move derivation
      var g = this.getcookedmoveperms() ;
      var n = g.length ;
      if (n > 30)
         throw "Canon info too big for bitmask" ;
      var orders = [] ;
      var commutes = [] ;
      for (var i=0; i<g.length; i++) {
         orders.push(g[i][5]) ;
         var permA = g[i][0] ;
         var bits = 0 ;
         for (var j=0; j<g.length; j++) {
            if (j == i)
               continue ;
            var permB = g[j][0] ;
            if (permA.mul(permB).compareTo(permB.mul(permA)) == 0) {
               bits |= 1<<j ;
            }
         }
         commutes.push(bits) ;
      }
      var curlev:any = {} ;
      curlev[0] = 1 ;
      for (var d=0; d<100; d++) {
         var sum = 0 ;
         var nextlev:any = {} ;
         var uniq = 0 ;
         for (var sti in curlev) {
            var st = +sti ; // string to number
            var cnt = curlev[st] ;
            sum += cnt ;
            uniq++ ;
            for (var mv=0; mv<orders.length; mv++) {
               if (((st >> mv) & 1) == 0 &&
                   (st & commutes[mv] & ((1 << mv) - 1)) == 0) {
                  var nst = (st & commutes[mv]) | (1 << mv) ;
                  if (nextlev[nst] == undefined)
                     nextlev[nst] = 0 ;
                  nextlev[nst] += (orders[mv]-1) * cnt ;
               }
            }
         }
         console.log("At depth " + d + " canonseq " + sum + " states " + uniq) ;
         curlev = nextlev ;
      }
   }
   getsolved():Perm { // get a solved position
      var r = [] ;
      for (var i=0; i<this.basefacecount; i++) {
         for (var j=0; j<this.stickersperface; j++) {
            r.push(i) ;
         }
      }
      return new Perm(r) ;
   }
   getpuzzles():Array<string> {
   // get some simple definitions of basic puzzles
      return [
         "c f 0", "2x2x2",
         "c f 0.333333333333333", "3x3x3",
         "c f 0.5 f 0", "4x4x4",
         "c f 0.6 f 0.2", "5x5x5",
         "c f 0.666666666666667 f 0.333333333333333 f 0", "6x6x6",
         "c f 0.714285714285714 f 0.428571428571429 f 0.142857142857143", "7x7x7",
         "c f 0.75 f 0.5 f 0.25 f 0", "8x8x8",
         "c f 0.777777777777778 f 0.555555555555556 f 0.333333333333333 f 0.111111111111111", "9x9x9",
         "c f 0.8 f 0.6 f 0.4 f 0.2 f 0", "10x10x10",
         "c f 0.818181818181818 f 0.636363636363636 f 0.454545454545455 f 0.272727272727273 f 0.0909090909090909", "11x11x11",
         "c f 0.833333333333333 f 0.666666666666667 f 0.5 f 0.333333333333333 f 0.166666666666667 f 0", "12x12x12",
         "c f 0.846153846153846 f 0.692307692307692 f 0.538461538461538 f 0.384615384615385 f 0.230769230769231 f 0.0769230769230769", "13x13x13",
         "c v 0", "skewb",
         "c v 0.275", "master skewb",
         "c v 0 v 0.38", "professor skewb",
         "c v 0.915641442663986", "compy cube",
         "c e 0.707106781186547", "helicopter",
         "c v 0.577350269189626", "dino",
         "c e 0", "little chop",
         "t e 0", "pyramorphix",
         "t e 0.346184634065199", "mastermorphix",
         "t v 0.333333333333333 v 1.66666666666667", "pyraminx",
         "t f 0", "Jing pyraminx",
         "t e 0.866025403784437", "master paramorphix",
         "d f 0.7", "megaminx",
         "d f 0.64 f 0.82", "gigaminx",
         "d f 0", "pentultimate",
         "d v 0.93796236956", "starminx",
         "d f 0.23606797749979", "starminx 2",
         "d f 0.447213595499989", "pyraminx crystal",
         "d v 0", "chopasaurus",
         "d e 0", "big chop",
         "o f 0", "skewb diamond",
         "o f 0.333333333333333", "FTO",
         "o v 0.577350269189626", "Christopher's jewel",
         "o e 0", "octastar",
         "o v 0.433012701892219", "Trajber's octahedron",
         "i f 0", "radio chop",
         "i v 0", "icosamate",
         "i v 0.18759247376021", "icosahedron 2",
         "i v 0.18759247376021 e 0", "icosahedron 3",
         "i v 0.84", "icosahedron static faces",
         "i v 0.73", "icosahedron moving faces",
      ] ;
   }
   parsedesc(s:string):any { // parse a text description
      var a = s.split(/ /).filter(Boolean) ;
      if (a.length % 2 == 0)
         return false ;
      if (a[0] != 'o' && a[0] != 'c' && a[0] != 'i' && a[0] != 'd' && a[0] != 't')
         return false ;
      var r = [] ;
      for (var i=1; i<a.length; i += 2) {
         if (a[i] != 'f' && a[i] != 'v' && a[i] != 'e')
            return false ;
         r.push([a[i], a[i+1]]) ;
      }
      return [a[0], r] ;
   }
   generatesvg(w:number, h:number, trim:number):string {
   // generate svg to interoperate with Lucas twistysim
      if (w == undefined || h == undefined) {
         w = 800 ;
         h = 500 ;
      }
      if (trim == undefined)
         trim = 10 ;
      w -= 2 * trim ;
      h -= 2 * trim ;
      function extendedges(a:Array<Array<number>>, n:number):void {
         var dx = a[1][0] - a[0][0] ;
         var dy = a[1][1] - a[0][1] ;
         var ang = 2*Math.PI/n ;
         var cosa = Math.cos(ang) ;
         var sina = Math.sin(ang) ;
         for (var i=2; i<n; i++) {
            var ndx = dx * cosa + dy * sina ;
            dy = dy * cosa - dx * sina ;
            dx = ndx ;
            a.push([a[i-1][0]+dx, a[i-1][1]+dy]) ;
         }
      }
      function drawedges(id:string, pts:Array<Array<number>>, color:string)
                                                                      :string {
         return "<polygon id=\"" + id + "\" class=\"sticker\" style=\"fill: " + color +
            "\" points=\"" +
            pts.map(function(p){return p[0] + " " + p[1]}).join(" ") +
            "\"/>\n" ;
      }
      // Find a net from a given face count.  Walk it, assuming we locate
      // the first edge from (0,0) to (1,1) and compute the minimum and
      // maximum vertex locations from this.  Then do a second walk, and
      // assign the actual geometry.
      this.genperms() ;
      var boundarygeo = this.getboundarygeometry() ;
      var face0 = boundarygeo.facenames[0][0] ;
      var polyn = face0.length ; // number of vertices; 3, 4, or 5
      var net = this.net ;
      if (net == null)
         throw "No net?" ;
      var edges:any = {} ;
      var minx = 0 ;
      var miny = 0 ;
      var maxx = 1 ;
      var maxy = 0 ;
      edges[net[0][0]] = [[1, 0], [0, 0]] ;
      extendedges(edges[net[0][0]], polyn) ;
      for (var i=0; i<net.length; i++) {
         var f0 = net[i][0] ;
         if (!edges[f0])
            throw "Bad edge description; first edge not connected." ;
         for (var j=1; j<net[i].length; j++) {
            var f1 = net[i][j] ;
            if (f1 == "" || edges[f1])
               continue ;
            edges[f1] = [edges[f0][j%polyn], edges[f0][(j+polyn-1)%polyn]] ;
            extendedges(edges[f1], polyn) ;
         }
      }
      for (var f in edges) {
         var es = edges[f] ;
         for (var i=0; i<es.length; i++) {
            minx = Math.min(minx, es[i][0]) ;
            maxx = Math.max(maxx, es[i][0]) ;
            miny = Math.min(miny, es[i][1]) ;
            maxy = Math.max(maxy, es[i][1]) ;
         }
      }
      var sc = Math.min(w/(maxx-minx), h/(maxy-miny)) ;
      var xoff = 0.5*(w-sc*(maxx+minx)) ;
      var yoff = 0.5*(h-sc*(maxy+miny)) ;
      var geos:any = {} ;
      var bg = this.getboundarygeometry() ;
      var edges2:any = {} ;
      var initv = [[sc+xoff, yoff], [xoff, yoff]] ;
      edges2[net[0][0]] = initv ;
      extendedges(edges2[net[0][0]], polyn) ;
      geos[this.facenames[0][1]] = this.project2d(0, 0,
                    [new Quat(0, initv[0][0], initv[0][1], 0),
                     new Quat(0, initv[1][0], initv[1][1], 0)]) ;
      var connectat = [] ;
      connectat[0] = 0 ;
      for (var i=0; i<net.length; i++) {
         var f0 = net[i][0] ;
         if (!edges2[f0])
            throw "Bad edge description; first edge not connected." ;
         var gfi = -1 ;
         for (var j=0; j<bg.facenames.length; j++)
            if (f0 == bg.facenames[j][1]) {
               gfi = j ;
               break ;
            }
         if (gfi < 0)
            throw "Could not find first face name " + f0 ;
         var thisface = bg.facenames[gfi][0] ;
         for (var j=1; j<net[i].length; j++) {
            var f1 = net[i][j] ;
            if (f1 == "" || edges2[f1])
               continue ;
            edges2[f1] = [edges2[f0][j%polyn], edges2[f0][(j+polyn-1)%polyn]] ;
            extendedges(edges2[f1], polyn) ;
            // what edge are we at?
            var caf0 = connectat[gfi] ;
            var mp = thisface[(caf0+j)%polyn].sum(thisface[(caf0+j+polyn-1)%polyn]).smul(0.5) ;
            var epi = PuzzleGeometry.findelement(bg.edgenames, mp) ;
            var edgename = bg.edgenames[epi][1] ;
            var gf1 = edgename[(f0 == edgename[0]) ? 1 : 0] ;
            var gf1i = -1 ;
            for (var k=0; k<bg.facenames.length; k++) {
               if (gf1 == bg.facenames[k][1]) {
                  gf1i = k ;
                  break ;
               }
            }
            if (gf1i < 0)
               throw "Could not find second face name" ;
            var otherface = bg.facenames[gf1i][0] ;
            for (var k=0; k<otherface.length; k++) {
               var mp2 = otherface[k].sum(otherface[(k+1)%polyn]).smul(0.5) ;
               if (mp2.dist(mp) <= PuzzleGeometry.eps) {
                  var p1 = edges2[f0][(j+polyn-1)%polyn] ;
                  var p2 = edges2[f0][j % polyn] ;
                  connectat[gf1i] = k ;
                  geos[gf1] = this.project2d(gf1i, k,
                          [new Quat(0, p2[0], p2[1], 0), new Quat(0, p1[0], p1[1], 0)]) ;
                  break ;
               }
            }
         }
      }
      // Let's build arrays for faster rendering.  We want to map from geo
      // base face number to color, and we want to map from geo face number
      // to 2D geometry.  These can be reused as long as the puzzle overall
      // orientation and canvas size remains unchanged.
      var pos = this.getsolved() ;
      var colormap = [] ;
      var facegeo = [] ;
      for (var i=0; i<this.basefacecount; i++)
         colormap[i] = this.colors[this.facenames[i][1]] ;
      for (var i=0; i<this.faces.length; i++) {
         var face = this.faces[i] ;
         var facenum = Math.floor(i/this.stickersperface) ;
         var g = geos[this.facenames[facenum][1]] ;
         var face2 = face.map(function(p){
                          return [trim+p.dot(g[0])+g[2].b, trim+h-p.dot(g[1])-g[2].c] ; }) ;
         facegeo.push(face2) ;
      }
      var svg = [] ;
      for (var i=0; i<this.faces.length; i++) {
         var cubie = this.facetocubies[i][0] ;
         var cubieori = this.facetocubies[i][1] ;
         var cubiesetnum = this.cubiesetnums[cubie] ;
         var cubieord = this.cubieordnums[cubie] ;
         var id = this.cubiesetnames[cubiesetnum] + "-l" + cubieord + "-o" + cubieori ;
         svg.push(drawedges(id, facegeo[i], colormap[pos.p[i]])) ;
      }
      var html = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 800 500">' +
      '<style type="text/css"><![CDATA[' +
      '.sticker { stroke: #000000; stroke-width: 1px; }' +
      ']]></style>' +
      svg.join('') + "</svg>" ;
      return html ;
   }
}
