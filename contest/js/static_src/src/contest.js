import Swal from 'sweetalert2'

import { get_data } from './util'

const update_url = get_data('update-url')
const deadline = Date.parse(get_data('deadline'))
const deadline_duration_seconds = get_data('deadline-duration')

//! 作答

const form = document.querySelector('form')
const filed_sets = Array.from(form.querySelectorAll('fieldset'))
const inputs = filed_sets.map(set => Array.from(set.querySelectorAll('input')))
/** @type {HTMLDivElement} */
const contest_bar = document.querySelector('div#contest-progress-bar')
/** @type {HTMLSpanElement} */
const contest_text = document.querySelector('span#contest-progress-text')
/** @type {HTMLButtonElement} */
const sub_btn = document.querySelector('button.text-lg')

function display_contest_progress () {
    const n_completed = inputs.filter(set => set.some(i => i.checked)).length

    contest_bar.style.width = `${100 * n_completed / inputs.length}%`
    contest_text.textContent = inputs.length - n_completed
}

async function update_contest_progress () {
    await fetch(update_url, {
        method: 'POST',
        body: new FormData(form)
    })
}

function update_contest_progress_end () {
    const formData = new FormData(form)
    Swal.fire({
        title: '此次作答已超时',
        html: '<p>正在提交中...</p>',
        icon: 'warning',
        confirmButtonText: '查看答卷',
        cancelButtonText: '查看成绩',
        showCancelButton: true
    })
        .then((msg) => {
            if (msg.isConfirmed) {
                filed_sets.forEach(set => { set.disabled = true })
                sub_btn.disabled = true
                sub_btn.className = sub_btn.className.replace(/text-red-.*?[ ]/ig, 'text-red-300/50')
                document.querySelectorAll('a[href="/contest/"]').forEach(e => { e.style = 'display: none !important' })
            } else {
                window.location.href = '/info'
            }
        })
    fetch(form.action, {
        method: form.method,
        body: formData,
    }).catch(err => {
        console.log(err)
    })
    Swal.getHtmlContainer().innerHTML = '<p>答卷提交完毕，无法再更改答卷，但您还可以查看自己的答卷。</p><p>（截止前作答部分已保存）</p>'
}

// 浏览器可能缓存之前答卷，因此进入页面后立即更新进度条
display_contest_progress()

// 每次修改时更新
form.addEventListener('input', () => {
    update_contest_progress()
    display_contest_progress()
})

// 截止时提交
setTimeout(update_contest_progress_end, deadline - Date.now())

//! 时间

/** 时间进度 */
class TimeProgress {
    constructor () {
        /** @type {HTMLDivElement} */
        this.bar = document.querySelector('div#time-progress-bar')
        /** @type {HTMLSpanElement} */
        this.text = document.querySelector('span#time-progress-text')
    }

    /**
     * @returns {number} 剩余秒数
     */
    get seconds_left () {
        // timestamps are in milliseconds.
        return (deadline - Date.now()) / 1e3
    }

    /**
     * @returns {number} 时间进度，0 代表发卷，1 代表截止
     */
    get progress () {
        return 1 - this.seconds_left / deadline_duration_seconds
    }

    /**
     * 更新进度条
     */
    update () {
        if (this.progress < 1) {
            this.bar.style.width = `${100 * this.progress}%`

            if (this.seconds_left > 100) {
                this.text.textContent = `${Math.round(this.seconds_left / 60)}分钟`
                setTimeout(() => { this.update() }, 1000)
            } else {
                this.text.textContent = `约${Math.round(this.seconds_left)}秒`
                setTimeout(() => { this.update() }, 100)
            }
        } else {
            this.bar.style.width = '100%'
            this.text.textContent = '0秒'
        }

        if (this.progress > 0.85) {
            this.bar.classList.add('time-progress-severe')
        }
    }
}
const time_progress = new TimeProgress()
time_progress.update()
