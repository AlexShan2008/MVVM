// 观察者的目的就是给需要变化的那个元素增加一个观察者
// 当数据变化后，执行对应的方法

class Watcher {
  constructor(vm, expr, callback) {
    this.vm = vm;
    this.expr = expr;
    this.callback = callback;
    // 先获取旧值；
    this.value = this.get();
  }
  getVal(vm, expr) { // 获取实例上对应的数据
    expr = expr.split('.'); // [message,a]
    return expr.reduce((prev, next) => { // vm.$data.a
      return prev[next];
    }, vm.$data);
  }
  get() {
    Dep.target = this;
    let value = this.getVal(this.vm, this.expr);
    Dep.target = null;
    return value;
  }
  // 对外暴露的方法；
  update() {
    let newValue = this.getVal(this.vm, this.expr);
    let oldValue = this.value;
    if (newValue !== oldValue) {
      // 对应的watch的callback方法
      this.callback(newValue);
    }
  }
}

// 用新值和老值进行比对，如果发生变化，就调用更新方法
// vm.$data VS expr
// vm.$watch(vm,'a',function(params){})