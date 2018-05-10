# 手写MVVM
- vue中实现双向数据绑定；
1. 模板的编译（只编译指令v-model v-test等 {{}}）
2. 数据劫持（get set）观察数据变化
3. Watcher(数据变化，重新编译模板)