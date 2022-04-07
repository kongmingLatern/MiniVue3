import { baseParse } from './parse';
import { transform } from './transform';
import { transformExpression } from './transforms/transformExpression';
import { transformElement } from './transforms/transformElement';
import { transformText } from './transforms/transformText';
import { generate } from './codegen';

export function baseCompile(template) {
  const ast: any = baseParse(template)
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText]
  })
  return generate(ast)
};
