const valueOfSelect = function (select) {
    var x = select
    return x.selectedOptions[0].value
}
// {
//     combinator: ['and', 'or'],
//     clause: {
//         messageType: {
//             '=': ['A', 'B'],
//             '!=': ['A', 'B'],
//             'contains': []
//         },
//         messageContent: {
//             '=': ['A', 'B'],
//             '!=': ['A', 'B'],
//             'contains': []
//         },
//     }
// }
const camelToNormalCaseDividedWord = function(word) {
    return word
}

const removeOptionsInDataList = function(dataList) {
    if (dataList.options.length == 0) {
        return
    }
    dataList.removeChild(dataList.options[0])
    removeOptionsInDataList(dataList)
}

const bind3SelectsLinkage = function(optionMetadata, combinatorSelect, fieldSelect, operatorSelect, valueDataList) {
    function appendOptionsFrom(optionValues, toAppend) {
        for (const x of optionValues) {
            var o = document.createElement('option');
            o.value = x;
            o.text = camelToNormalCaseDividedWord(x);
            toAppend.appendChild(o);
        }
    }
    
    // 每次 append 之后都得 trigger 一次 change 事件
    // 这里的事件 trigger 本来是在本函数末尾进行两次，但是这样有 bug：除了第一次后面就不会联动了
    // 想通了后，像现在这样就对了
    appendOptionsFrom(optionMetadata.combinator, combinatorSelect)
    appendOptionsFrom(Object.keys(optionMetadata.clause), fieldSelect)
    var selecteds = [ undefined, undefined, ]
    fieldSelect.addEventListener('change', function (e) {
        var selectedValue = valueOfSelect(fieldSelect)
        // log('field select change', selectedValue)
        selecteds[0] = selectedValue
        operatorSelect.options.length = 0
        appendOptionsFrom(Object.keys(optionMetadata.clause[selecteds[0]]), operatorSelect)
        var e1 = new Event('change')
        operatorSelect.dispatchEvent(e1)
    })
    
    operatorSelect.addEventListener('change', function (e) {
        var selectedValue = valueOfSelect(operatorSelect)
        selecteds[1] = selectedValue
        // log('operator select change', selectedValue)
        removeOptionsInDataList(valueDataList)
        var valueOptions = optionMetadata.clause[selecteds[0]][selecteds[1]]
        // log('value options', valueOptions)
        appendOptionsFrom(valueOptions, valueDataList)
    })
    var e0 = new Event('change')
    fieldSelect.dispatchEvent(e0)
}