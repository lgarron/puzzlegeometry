import {Quat} from "../src/Quat"

import { expect } from "chai";

describe("Quat", () => {
  it("should multiply", () => {
    var a = new Quat(3,1,4,1);
    var b = new Quat(5,9,2,6);
    var c = a.mul(b) ;
    expect(0==c.dist(new Quat(-8,54,29,-11)));
  });
});
