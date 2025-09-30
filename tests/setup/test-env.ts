import { expect } from 'vitest';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
// @ts-ignore
expect.extend(jestDomMatchers);

if(!HTMLElement.prototype.scrollIntoView){
  HTMLElement.prototype.scrollIntoView = function(){ /* noop */ } as any;
}
