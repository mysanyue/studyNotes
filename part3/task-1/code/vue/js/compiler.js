/**
 * 功能
 * 1. 负责编译模板，解析指令/差值表达式
 * 2. 负责页面的首次渲染
 * 3. 当数据变化后重新渲染视图
 */

class Compiler {
  constructor(vm) {
    this.el = vm.$el
    this.vm = vm
    this.compile(this.el)
  }

  // 编译模板，处理文本节点和元素节点
  compile(el) {
    const childNodes = el.childNodes
    Array.from(childNodes).forEach(node => {
      if (this.isTextNode(node)) {
        // 处理文本节点
        this.compileText(node)
      } else if (this.isElementNode(node)) {
        // 处理元素节点
        this.compileElement(node)
      }

      // 判断 node 节点是否有子节点，如果有子节点要递归调用 compile
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }

  // 编译元素节点，处理指令
  compileElement(node) {
    // 遍历所有属性节点
    Array.from(node.attributes).forEach(attr => {
      let attrName = attr.name
      if (this.isDirectiveOn(attrName)) {
        // 判断是否是事件指令
        // v-on:
        attrName = attrName.substr(5)
        this.onUpdater(node, attrName, attr.value)
      } else if (this.isDirective(attrName)) {
        // 判断是否是指令
        // v-text --> text
        attrName = attrName.substr(2)
        this.update(node, attr.value, attrName)
      }
    })
  }

  update(node, key, attrName) {
    let updateFn = this[attrName + 'Updater']
    updateFn && updateFn.call(this, node, this.vm[key], key)
  }

  // 处理 v-text 指令
  textUpdater(node, value, key) {
    node.textContent = value
    // 创建 watcher 对象，当数据改变更新视图
    new Watcher(this.vm, key, newValue => node.textContent = newValue)
  }

  // 处理 v-model 指令
  modelUpdater(node, value, key) {
    node.value = value
    // 创建 watcher 对象，当数据改变更新视图
    new Watcher(this.vm, key, newValue => node.textContent = newValue)
    // 双向绑定
    node.addEventListener('input', () => this.vm[key] = node.value)
  }

  // 处理 v-on 指令
  onUpdater(node, value, key) {
    node.addEventListener(value, () => this.vm[key]())
  }
  // 处理 v-html 指令
  htmlUpdater(node, value, key) {
    node.textContent = value
    // 创建 watcher 对象，当数据改变更新视图
    new Watcher(this.vm, key, newValue => node.textContent = newValue)
  }

  // 编译文本节点，处理差值表达式
  compileText(node) {
    const reg = /\{\{(.+?)\}\}/
    const value = node.textContent
    if (reg.test(value)) {
      let key = RegExp.$1.trim()
      node.textContent = value.replace(reg, this.vm[key])

      // 创建 watcher 对象，当数据改变更新视图
      new Watcher(this.vm, key, newValue => node.textContent = newValue)
    }
  }

  // 判断元素属性是否是指令
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }

  // 判断元素是否是事件指令
  isDirectiveOn(attrName) {
    return attrName.startsWith('v-on:')
  }

  // 判断节点是否是文本节点
  isTextNode(node) {
    return node.nodeType === 3
  }

  // 判断节点是否是元素节点
  isElementNode(node) {
    return node.nodeType === 1
  }
}