class Observer {
  constructor(data) {
    this.observer(data);
  }
  observer(data) {
    // 要对这data数据将原有的属性改成set和get形式
    // data:{} 对象数据类型才劫持
    if (!data || typeof data !== 'object') {
      return;
    }
    // 是对象，在劫持
    // 先获取data的key和value
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key]);//响应式更新数据
      this.observer(data[key]);//深度递归劫持
    })

  }
  // 定义响应式
  defineReactive(obj, key, value) {
    let that = this;
    let dep = new Dep();
    // 在获取某个值的时候，
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        // 当取值时调用的方法
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set(newValue) {
        // 当给data属性中设置值的时候，更改获取的属性的值
        if (newValue != value) {
          // 这里的this不是实体
          that.observer(newValue);//如果是对象继续劫持
          value = newValue;
          dep.notify();//通知所有人数据更新了，逐个去调用watcher
        }
      }
    })
  }
}
// 发布订阅
class Dep {
  constructor() {
    this.subs = [];//订阅的数组
  }
  addSub(watcher) {
    this.subs.push(watcher);
  }
  notify() {
    this.subs.forEach(watcher => watcher.update());
  }
}