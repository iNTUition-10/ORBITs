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
        sendResponse({data});
    }
})