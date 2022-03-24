# Reactive 依赖收集思路
~~~ts
// get 操作 => target => key => dep
/*
  结构
  [target]
      -> [key] 
            -> [fn()]
  ----------第一种情况----------
  effect(function effectFn1() => {
    user.age1
  })
 
  effect(function effectFn2() => {
    user.age1
  })
 
  user
    -> age1
          -> effectFn1
          -> effectFn2
 
  ----------第二种情况----------
  effect(() => {
    user.age1
    user.age2
  })
 
  结构
  [target]
      -> [key] 
            -> [fn()]
 
  user
    -> age1
          -> effect
    -> age2
          -> effect
 
  ----------第三种情况----------
  effect(function effectFn1() => {
    user.age1
  })
 
  effect(function effectFn2() => {
    user.age2
  })
 
  user
    -> age1
          -> effectFn1
    -> age2
          -> effectFn2
 
 
  @params
  target: 当前对象
  key: 字段
*/
~~~