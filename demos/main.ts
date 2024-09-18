/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-09-10 16:56:16
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-11 10:47:23
 * @FilePath: \react\demos\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import {
    unstable_IdlePriority as IdlePriority,
    //低优先级
    unstable_LowPriority as LowPriority,
    //用户阻塞优先级
    unstable_UserBlockingPriority as UserBlockingPriority,
    //普通优先级
    unstable_NormalPriority as NormalPriority,
    //立刻执行的优先级
    unstable_ImmediatePriority as ImmediatePrity,
    // 当某一个preform正在被调度，但是还没被执行时，可以使用该函数进行取消
    unstable_cancelCallback as cancelCallback,
    // 用于调度preform方法
    unstable_scheduleCallback as scheduleCallback,
    // 当前帧是否用尽了, 用尽了为true，此时需要中断任务
    unstable_shouldYield as shouldYield,
    // 返回当前正在调度的任务
    unstable_getFirstCallbackNode as getFirstCallbackNode,

} from 'scheduler'


/**
 *  
 * react 同步存在卡顿问题，通过调度器可以解决这个问题
 *  
 * 通过时间切片,可以中断当前流程和执行其他任务,从而解决卡顿问题
 *  
 */



const button = document.querySelector('button');
const root = document.querySelector('#root')

// [LowPriority, UserBlockingPriority, NormalPriority, ImmediatePrity].foreach((it) => {
//     const btn = document.createElement('button')
//     root.appendChild(btn)

//     btn.innerHTML = [
//         '',
//         "ImmediatePrity",
//         "UserBlockingPriority",
//         "NormalPriority",
//         "LowPriority"
//     ][it]

// })

// 工作单元
const workLisk = []

button.onclick = () => {
    // 插入100条任务
    workLisk.unshift({
        count: 100
    })
    schedule()
}

let prevPriority = IdlePriority //保存上次的优先级
let currentCallback = null


function schedule() {
    const cbNode = getFirstCallbackNode()
    const curWork = workLisk.sort((a, b) => a.priority - b.priority)[0] //根据优先级排序,获取优先级最高的


    // 如果当前没有任务了，则取消之前的任务
    if (!curWork) {
        currentCallback = null
        cbNode && cancelCallback(curWork)
        return
    }


    // 以前是直接执行，同步，现在根据优先级执行
    const { priority: currentPriority } = curWork

    //  策论逻辑,对比本次优先级和之前优先级，做出判断
    if (currentPriority === prevPriority) {
        return //同一优先级，不执行
    }


    // 进入这个逻辑，就一定是有更高优先级,所以先取消上次函数
    cbNode && cancelCallback(curWork)
    currentCallback = scheduleCallback(currentPriority, perform.bind(null, curWork))

    // if (curWork) {
    //     perform(curWork)
    // }
}

function perform(wrok, didTimeout) {

    /**
     * 中断条件 :1.优先级级别 2.饥饿问题,一直不执行会过期变同步 3.时间切片，浏览器需要控制权
     */


    const needSync = work.priority === ImmediatePrity || didTimeout || shouldYield()

    // 如果是同步执行或时间切片还存在时间 并且存在任务，则执行

    while ((needSync || !shouldYield()) && wrok.count) {
        wrok.count--
        insertSan(0)
    }

    // 中断 ||  执行完，移除
    prevPriority = work.priority // 保存上次执行的优先级，方便做策略逻辑
    if (!wrok.count) {
        const index = workLisk.indexOf(wrok)
        workLisk.splice(index, 1)

        prevPriority = IdlePriority //执行完毕，优先级归为Idle空闲
    }


    /**
     * 这里是避免重复执行work，全程只能保持一个work执行.
     * 如果 第一次进来，执行 schedule ，执行中断后，再次进入schedule的优先级是一样，会直接跳出schedule，然后 prevCallback h和 newCallback 一致则返回perform执行上次任务
     */

    const prevCallback = currentCallback
    schedule()
    const newCallback = currentCallback

    if (newCallback && newCallback === prevCallback) {
        return perform.bind(null, work)  //调度返回一个新的函数，可以继续执行。  
    }
}

function insertSan(content) {
    const span = document.createElement('span')
    span.textContent = content
    root.appendChild(span)
}