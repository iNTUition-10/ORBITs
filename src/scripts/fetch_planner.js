// 此脚本将在用户访问https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.planner时加载
// 用于获取planner的form，与插件通信

console.log("fetch_planner.js loaded")

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "GET_FORM0") { // document.forms[0] 用于获取课程的slots
        var form = document.forms[0]
        console.log("fetch_planner.js received request, getting forms[0]", form)
        var data = Object()
        /* 
        <form action="AUS_STARS_PLANNER.course_info" method="post" id="xyz">
        <input type="hidden" name="acad" value="2023">
        <input type="hidden" name="semester" value="2">
        <input type="hidden" name="p1" value="AB37DBA772BECF60DE9BF3B0A3EE498FC14551AB26B94DF271172BCBF30C27E8925F11D608644E05D0FA96CDDD34DA86">
        <input type="hidden" name="p2" value="1DA9DAC0A213C54A0A4CB7A0DC3273A6BF8FA5D1947F42C5258052553BC170913FB2273B60AEF8C401D2BAD119DE2B4A">
        <input type="hidden" name="FullPart" value="F">
        <input type="hidden" name="matric" value="U2222867A">
        <input type="hidden" name="r_subj_code" value="">
        </form>
        */
        for(var i=0, rows=form.length; i<rows; i++) {
            var row = form[i]
            if (row.tagName == "INPUT") {
                data[row.name] = row.value
            }
        }
        console.log("parsed form[0], sending back to plugin. data: ", data)
        cookies = document.cookie // 获取当前标签页cookies用于请求
        sendResponse({data, cookies});
    }else if(request.action == "GET_COURSES") { // 获取所有添加到STARS列表中的课程
        c = document.querySelectorAll('[title="Click link for more details"]')
        console.log("Getting all selected courses...", c)
        data = []
        for (var i=0; i<c.length; i++) {
            code = c[i].firstChild.innerHTML //"AB1201"
            hash = c[i].parentNode.href //"javascript:view_subject(document.forms[0],'7C1FA564DAA130C9');" 
            hash = hash.split("'")[1] //"7C1FA564DAA130C9"
            data.push({code, hash})
        }
        console.log(data)
        sendResponse({data: data})
    }else if(request.action == "PARSE") {
        console.log("fetch_planner.js received request, parsing html")
        res = new DOMParser().parseFromString(request.html, "text/html")
        console.log("fetch_planner.js parsed html, ", res)
        code = res.querySelector('[title="Add to Course Codes list"]').parentNode.href.split("'")[1]
        if(request.html.includes("for course is not available.")){
            console.log("Course not available ", code)
            sendResponse({code, index: []})
        }else{
            res = res.getElementsByTagName('tbody')[1]
            result = Object()
            index = ""
            in_index = []
            for(var i=1; i<res.childElementCount; i++){
                cur = []
                line = res.children[i]
                if(line.children[0].children[0].innerHTML != "&nbsp;"){
                    if(index != ""){
                        result[index] = in_index
                        cur = []
                        in_index = []
                    }
                    index = line.children[0].children[0].innerHTML.replace("&nbsp;","")
                }
                cur.push(line.children[1].children[0].innerHTML)
                cur.push(line.children[2].children[0].innerHTML)
                cur.push(line.children[3].children[0].innerHTML)
                cur.push(line.children[4].children[0].innerHTML)
                cur.push(line.children[5].children[0].innerHTML)
                cur.push(line.children[6].children[0].innerHTML.replace("&nbsp;",""))
                in_index.push(cur)
            }
            result[index] = in_index
            console.log("fetch_planner.js parsed html, sending back to plugin. result: ", result)
            sendResponse({code, index: result})
    }}
})
