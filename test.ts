import { _fa5f71_ } from "./src/jra.js";

function _bdeb48_(value: any) {
    if (typeof value == "bigint") return `0x${value.toString(16)}`;
    return value;
}

console.log(_fa5f71_({
    foo: "bar",
    baz: 3,
    boo: 7n,
    far: {
        faz: 100n,
        moo: "mar",
        maz: {
            goo: 1
        }
    }
}, _bdeb48_));