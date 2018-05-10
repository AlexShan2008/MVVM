class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el); //#app document.querySelector('el)
    this.vm = vm;
    // 如果有元素，再编译
    if (this.el) {
      // 1. 先把真实的DOM移入到内存中fragment
      let fragment = this.node2fragment(this.el);

      // 2. 编译 =》提取想要的元素节点v-model和文本节点{{}}
      this.compile(fragment);
      //3. 把编译好的fragment在塞回到页面中取
      this.el.appendChild(fragment);
    }
  }
  /** 辅助方法 **/
  // 1. 判断是否是元素节点
  isElementNode(node) {
    return node.nodeType === 1; //元素
  }
  // 2. 判断是不是指令v-model
  isDirective(name) {
    return name.includes('v-');
  }

  /** 核心方法 **/
  // 1. 把真实节点转移到内存中
  node2fragment(el) {
    // 需要将#app中的内全部放到内存中
    // 内存中的文档碎片
    let fragment = document.createDocumentFragment();
    let firstChild;
    while (firstChild = el.firstChild) {
      fragment.appendChild(firstChild);
    }
    return fragment;//内存中的节点
  }

  // 编译元素
  compileElement(node) {
    // v-model v-bind v-text
    let attrs = node.attributes;//取出当前节点属性  v-model='message'
    Array.from(attrs).forEach(attr => {
      // attr.name 判断是否有 v-的属性
      let attrName = attr.name;
      if (this.isDirective(attrName)) {
        // 取到对应的值放到节点中
        let expr = attr.value;
        // node this.vm.$data v-model v-text -v-html 
        let [, type] = attrName.split('-');//[v,model] //v-model
        CompileUtil[type](node, this.vm, expr);
      };
    })

  }
  // 编译文本
  compileText(node) {
    // {{ message }}   {{a}} {{b}} {{c}}
    let expr = node.textContent;//取文本中的内容；
    let reg = /\{\{([^}]+)\}\}/g;
    if (reg.test(expr)) {
      // 有文本内容
      // node this.vm.$data expr
      CompileUtil['text'](node, this.vm, expr);
    }
  }
  // 2. 编译
  compile(fragment) {
    //childNodes只能取第一级子节点
    let childNodes = fragment.childNodes;
    // 需要递归去除所有级别子元素; 
    // 转成数组
    Array.from(childNodes).forEach(node => {
      if (this.isElementNode(node)) {
        // 是元素节点，遍历去除所有子元素
        this.compileElement(node);
        this.compile(node);
      } else {
        // 编译文本{{}}
        this.compileText(node);
      }
    })
  }
}

// 
CompileUtil = {
  // 获取实例上对应的数据
  getVal(vm, expr) { // 获取实例上对应的数据
    expr = expr.split('.'); // [message,a]
    return expr.reduce((prev, next) => { // vm.$data.a
      return prev[next];
    }, vm.$data);
  },
  setVal(vm, expr, value) {
    expr = expr.split('.');
    // 收敛
    return expr.reduce((prev, next, currentIndex) => {
      if (currentIndex === expr.length - 1) {
        return prev[next] = value;
      }
      return prev[next];
    }, vm.$data)

  },
  getTextVal(vm, expr) { // 获取编译文本后的结果
    return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      return this.getVal(vm, arguments[1]);
    })
  },
  text(node, vm, expr) { // 文本处理
    let updateFn = this.updater['textUpdater'];
    // {{message.a}} => hello,zfpx;
    let value = this.getTextVal(vm, expr);
    // 数据变化，应该更新视图，调用watcher的callback
    // {{a}} {{b}}
    expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      new Watcher(vm, arguments[1], (newValue) => {
        // 如果数据变化了，文本节点需要重新获取依赖的属性，更新文本中的内容
        updateFn && updateFn(node, this.getTextVal(vm, expr));
      });
    })
    updateFn && updateFn(node, value);

  },
  model(node, vm, expr) {
    // 输入框处理 v-model
    let updateFn = this.updater['modelUpdater'];
    // 调用callback时会执行此方法
    new Watcher(vm, expr, (newValue) => {
      // 当值变化后，会调用callback将newValue传递过来；
      updateFn && updateFn(node, this.getVal(vm, expr));//判断是否有此指令
    });
    node.addEventListener('input', (e) => {
      let newValue = e.target.value;
      this.setVal(vm, expr, newValue);
    })

    updateFn && updateFn(node, this.getVal(vm, expr));//判断是否有此指令

  },
  updater: {
    // 文本更新
    textUpdater(node, value) {
      node.textContent = value
    },
    // 输入框更新
    modelUpdater(node, value) {
      node.value = value;
    }
  }
}