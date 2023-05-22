// 遊戲(程式)"狀態" 放在最上方
const GAME_STATE = {
    FirstCardAwaits: "FirstCardAwaits",
    SecondCardAwaits: "SecondCardAwaits",
    CardsMatchFailed: "CardsMatchFailed",
    CardsMatched: "CardsMatched",
    GameFinished: "GameFinished",
}

//卡牌花色
const Symbols = [
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]



//使用者介面UI區塊
const view = {

    //建立卡片內容
    getCardContent(index) {
        const number = this.transformNumber((index % 13) + 1)
        const symbol = Symbols[Math.floor(index / 13)]
        return `<p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>`
    },

    //建立卡片編號
    getCardElement(index) {
        return `<div data-index="${index}"class="card back"></div>`
    },

    //將卡片數字轉字符
    transformNumber(number) {
        switch (number) {
            case 1:
                return 'A'
            case 11:
                return 'J'
            case 12:
                return 'Q'
            case 13:
                return 'K'
            default:
                return number
        }
    },

    //渲染卡片s
    displayCards(indexes) {
        const rootElement = document.querySelector("#cards")
        rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
        //這裡indexes是變數 後面呼叫時會將 utility.getRandomNumberArray(52)傳入
        
        //.map()  依序將陣列中元素一個一個帶入 呼叫this.getCardElement(元素) 這裡.map會產生一個有52個元素的陣列
        //.join()  再用''一個一個連接成字串，否則會是陣列形式(HTML不吃)
    },

    //...可以接受多個參數，並轉成陣列 如:flipCards(1,2,3,4,5,...)   cards = [1,2,3,4,5,...]

    //處理翻牌動作
    flipCards(...cards) {
        cards.map(card => {
            //如果是背面
            //回傳正面
            if (card.classList.contains('back')) {
                card.classList.remove('back')
                card.innerHTML = this.getCardContent(Number(card.dataset.index))
                return
            }
            //如果是正面
            //回傳背面
            card.classList.add('back')
            card.innerHTML = null
        })
    },

    //配對成功應該長怎樣
    pairCards(...cards) {
        cards.map(card => {
            card.classList.add('paired')
        })
    },

    //渲染分數
    renderScore(score) {
        document.querySelector('.score').textContent = `Score: ${score}`
    },

    //渲染嘗試次數
    renderTriedTimes(times) {
        document.querySelector('.tried').textContent = `You've tried: ${times} times`
    },

    //加入錯誤閃爍動畫
    appendWrongAnimation(...cards) {
        cards.map(card => {
            card.classList.add('wrong')
            card.addEventListener('animationend', e => {
                card.classList.remove('wrong')
            }, {
                //代表只有一次，因為多次EventListener會造成瀏覽器負擔(假設今天有上萬)
                once: true
            })
        })
    },

    //遊戲結束
    showGameFinished() {
        const div = document.createElement('div')
        div.classList.add('completed')
        div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
        const header = document.querySelector('#header')
        header.before(div)
    }
}

//由最後一張牌往前，將該牌和隨機一張牌做交換，小模塊
const utility = {
    getRandomNumberArray(count) {
        //期望:  count = 5 => [4,1,2,0,3]
        const number = Array.from(Array(count).keys())
        //預想將最後一張(number.length - 1)和隨機一張做交換
        for (let index = number.length - 1; index > 0; index--) {
            //從最後一張開始往前洗牌
            let randomIndex = Math.floor(Math.random() * (index + 1));
            [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
        }
        return number
    }
}
//Array.from(Array(count).keys())
//Array.from()  =>  由()內的 類陣列或可迭代物建  建立  成為Array實體
//Array(52)  => 產生一個有52空位置的陣列
//Array().keys()  =>  從陣列中依序傳出每一組的序列(52) => 0~51



//程式控制區塊
const controller = {
    currentState: GAME_STATE.FirstCardAwaits,  // 加在第一行 設定初始值

    //建立卡片
    generateCards() {
        view.displayCards(utility.getRandomNumberArray(52))
    },

    //依據不同"遊戲狀態"，做不同行為
    dispatchCardAction(card) {
        if (!card.classList.contains('back')) {
            return
        }

        switch (this.currentState) {
            //第一次翻
            case GAME_STATE.FirstCardAwaits:
                view.flipCards(card)
                model.revealedCards.push(card)
                this.currentState = GAME_STATE.SecondCardAwaits
                break
            //第二次翻
            case GAME_STATE.SecondCardAwaits:
                view.renderTriedTimes(++model.triedTimes)

                view.flipCards(card)
                model.revealedCards.push(card)

                //判斷是否配對成功
                if (model.isRevealedCardsMatched()) {
                    //配對正確
                    view.renderScore((model.score += 10))

                    this.currentState = GAME_STATE.CardsMatched
                    view.pairCards(...model.revealedCards)
                    model.revealedCards = []
                    //勝利
                    if (model.score === 260) {
                        // console.log('showGameFinished')
                        this.currentState = GAME_STATE.GameFinished
                        view.showGameFinished()  // 加在這裡
                        return
                    }
                    this.currentState = GAME_STATE.FirstCardAwaits
                } else {
                    //配對失敗
                    this.currentState = GAME_STATE.CardsMatchFailed
                    view.appendWrongAnimation(...model.revealedCards)
                    //setTimeout第一個參數是要呼叫funtion，而不是"呼叫完的結果"(不是"this.resetCards()")
                    //設定顯示時間1000ms=1s
                    setTimeout(this.resetCards, 1000)
                }
                break
        }
        // console.log('this.currentState', this.currentState)
        // console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
    },

    //將卡片翻回去
    resetCards() {
        //兩張翻回去.清空暫存牌.設狀態
        view.flipCards(...model.revealedCards)
        model.revealedCards = []
        //這邊不能用this.currentState要用controller.currentState
        //因為setTimeout(this.resetCards, 1000)要呼叫這函式
        //所以這邊this.currentState會不等於controller.currentState
        //而是瀏覽器，因為setTimeout是瀏覽器提供的
        controller.currentState = GAME_STATE.FirstCardAwaits
    }
}



//資料管理區塊
const model = {
    revealedCards: [],

    //判斷兩卡是否為同值
    isRevealedCardsMatched() {
        return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    },

    score: 0,

    triedTimes: 0
}



//主程式
controller.generateCards()

//這是一個nodelist(array-like)不能使用.map
document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", event => {
        controller.dispatchCardAction(card)
    })
})

