/** Offline test fixture, never a real semantic judge. */
export function mockJudge(scores){
 return {id:'mock',model:'synthetic-fixture',external:false,async judge(){return JSON.stringify({scores});}};
}
