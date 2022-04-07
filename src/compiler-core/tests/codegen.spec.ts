import { generate } from '../src/codegen';
import { baseParse } from '../src/parse';
import { transform } from '../src/transform';
import { transformExpression } from '../src/transforms/transformExpression';
import { transformElement } from '../src/transforms/transformElement';
import { transformText } from '../src/transforms/transformText';
describe('codegen', () => {
  it('string', () => {
    const ast = baseParse("hi")
    transform(ast)
    const { code } = generate(ast)
    // 快照测试(string)
    // 1.抓bug
    // 2.有意()
    expect(code).toMatchSnapshot()
  });

  it('interpolation', () => {
    const ast = baseParse("{{message}}")
    transform(ast, {
      nodeTransforms: [transformExpression]
    })
    const { code } = generate(ast)
    // 快照测试(string)
    // 1.抓bug
    // 2.有意()
    expect(code).toMatchSnapshot()
  });

  it('element', () => {
    const ast = baseParse("<div></div>")
    transform(ast, {
      nodeTransforms: [transformElement]
    })
    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  });

  it('element and interpolation', () => {
    const ast = baseParse("<div>hi,{{msg}}</div>")
    transform(ast, {
      nodeTransforms: [transformElement, transformText, transformExpression]
    })
    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  });
});