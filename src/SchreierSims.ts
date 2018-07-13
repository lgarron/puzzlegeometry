import { Perm } from "./Perm" ;
export class SchreierSims {
   static schreiersims(g:Array<Perm>):void {
      var n = g[0].p.length ;
      var e = Perm.e(n) ;
      var sgs:Array<Array<Perm>> = [] ;
      var sgsi:Array<Array<Perm>> = [] ;
      var sgslen:Array<Array<number>> = [] ;
      var Tk:Array<Array<Perm>> = [] ;
      var Tklen:Array<Array<number>> = [] ;
      function resolve(p:Perm):boolean {
         for (var i=p.p.length-1; i>=0; i--) {
            var j = p.p[i] ;
            if (j != i) {
               if (!sgs[i][j])
                  return false ;
               p = p.mul(sgsi[i][j]) ;
            }
         }
         return true ;
      }
      function knutha(k:number, p:Perm, len:number):void {
         Tk[k].push(p) ;
         Tklen[k].push(len) ;
         for (var i=0; i<sgs[k].length; i++)
            if (sgs[k][i])
               knuthb(k, sgs[k][i].mul(p), len+sgslen[k][i]) ;
      }
      function knuthb(k:number, p:Perm, len:number):void {
         var j = p.p[k] ;
         if (!sgs[k][j]) {
            sgs[k][j] = p ;
            sgsi[k][j] = p.inv() ;
            sgslen[k][j] = len ;
            for (var i=0; i<Tk[k].length; i++)
               knuthb(k, p.mul(Tk[k][i]), len+Tklen[k][i]) ;
            return ;
         }
         var p2 = p.mul(sgsi[k][j]) ;
         if (!resolve(p2))
            knutha(k-1, p2, len+sgslen[k][j]) ;
      }
      function getsgs():void {
         sgs = [] ;
         sgsi = [] ;
         Tk = [] ;
         sgslen = [] ;
         Tklen = [] ;
         for (var i=0; i<n; i++) {
            sgs.push([]) ;
            sgsi.push([]) ;
            sgslen.push([]) ;
            Tk.push([]) ;
            Tklen.push([]) ;
            sgs[i][i] = e ;
            sgsi[i][i] = e ;
            sgslen[i][i] = 0 ;
         }
         var avgs = [] ;
         var none = 0 ;
         for (var i=0; i<g.length; i++) {
            knutha(n-1, g[i], 1) ;
            var sz = 1 ;
            var tks = 0 ;
            var sollen = 0 ;
            var avgs = [] ;
            var mults = [] ;
            for (var j=0; j<n; j++) {
               var cnt = 0 ;
               var lensum = 0 ;
               for (var k=0; k<n; k++)
                  if (sgs[j][k]) {
                     cnt++ ;
                     lensum += sgslen[j][k] ;
                     if (j != k)
                        none++ ;
                  }
               tks += Tk[j].length ;
               sz *= cnt ;
               if (cnt > 1)
                  mults.push(cnt) ;
               var avg = lensum / cnt ;
               avgs.push(avg) ;
               sollen += avg ;
            }
            console.log("After adding " + i + " sz is " + sz + " T " + tks + " sollen " + sollen + " none " + none + " mults " + mults) ;
         }
      }
      getsgs() ;
   }
}
