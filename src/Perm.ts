export class Perm {
   n:number ;        // length
   p:Array<number> ; // The permutation itself
   constructor(a:Array<number>) {
      this.n = a.length ;
      this.p = a ;
   }
   toString():string { // stringify
      return 'Perm[' + this.p.join(' ') + ']' ;
   }
   mul(p2:Perm):Perm { // multiply
      var c:Array<number> = Array(this.n) ;
      for (var i=0; i<this.n; i++)
         c[i] = p2.p[this.p[i]] ;
      return new Perm(c) ;
   }
   rmul(p2:Perm):Perm { // multiply the other way
      var c = Array(this.n) ;
      for (var i=0; i<this.n; i++)
         c[i] = this.p[p2.p[i]] ;
      return new Perm(c) ;
   }
   inv():Perm {
      var c = Array(this.n) ;
      for (var i=0; i<this.n; i++)
         c[this.p[i]] = i ;
      return new Perm(c) ;
   }
   static e(n:number) {
      var c = Array(n) ;
      for (var i=0; i<n; i++)
         c[i] = i ;
      return new Perm(c) ;
   }
   static random(n:number) { // random
      var c = Array(n) ;
      for (var i=0; i<n; i++)
         c[i] = i ;
      for (var i=0; i<n; i++) {
         var j = i + Math.floor((n-i)*Math.random()) ;
         var t = c[i] ;
         c[i] = c[j] ;
         c[j] = t ;
      }
      return new Perm(c) ;
   }
   compareTo(p2:Perm):number { // comparison
      for (var i=0; i<this.n; i++)
         if (this.p[i] != p2.p[i])
            return this.p[i]-p2.p[i] ;
      return 0 ;
   }
}
