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
        <input type="hidden" name="p1" value="xx">
        <input type="hidden" name="p2" value="xx">
        <input type="hidden" name="FullPart" value="xx">
        <input type="hidden" name="matric" value="xx">
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
    }else if(request.action == "APPLY") {
        console.log("fetch_planner.js Applying schedule..." )
        chrome.storage.local.get(['optimized']).then(optimized => {
            optimized = optimized.optimized
            console.log("optimized schedule from storage", optimized)
            for(var i = 0; i<Object.entries(optimized).length; i++){
                code = Object.entries(optimized)[i][0]
                index = Object.entries(optimized)[i][1].index
                console.log("fetch_planner.js replacing ", code, " index ", index)
                if(document.querySelector('[value="'+index+'"]').parentNode.querySelector('[selected="selected"]'))
                document.querySelector('[value="'+index+'"]').parentNode.querySelector('[selected="selected"]').removeAttribute("selected")
                document.querySelector('[value="'+index+'"]').setAttribute("selected", "selected")
                console.log("fetch_planner.js selected course ", code)
            }
            document.getElementsByTagName("form")[1].action='AUS_STARS_PLANNER.save_time_table'
            sendResponse({status: "done, good bye!"})
            document.getElementsByTagName("form")[1].submit()
        })
        return true // 异步
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
            index = ""
            choices = []
            in_index = []
            for(var i=1; i<res.childElementCount; i++){
                cur = []
                line = res.children[i]
                if(line.children[0].children[0].innerHTML != "&nbsp;"){
                    if(index != ""){
                        choices.push({"Index": index, "Timetable": in_index})
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
                remark = line.children[6].children[0].innerHTML.replace("&nbsp;","")
                if (remark == "") {
                    cur.push("Teaching Wk1-13")
                }else{
                    cur.push(remark)
                }
                in_index.push(cur)
            }
            choices.push({"Index": index, "Timetable": in_index})
            console.log("fetch_planner.js parsed html, sending back to plugin.")
            sendResponse({code, index: choices})
    }}
})
