// Side-effect CSS imports (`import "./styles/index.css"`) carry no runtime
// value — they tell the bundler to include the stylesheet. Declare the module
// so `tsc` accepts them.
declare module "*.css" {
  const content: string
  export default content
}
