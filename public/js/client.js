//Load Client side JavaScript
console.log("JavaScript Loaded!")


// Select our Get Tasks form
const tasksForm = document.querySelector('#getTasks') // Selects form HTML element
// console.log(tasksForm)
const taskListElement = document.querySelector('#ul')
var sortByCompletedTrue = document.getElementById('ctrue')
var sortByCompletedFalse = document.getElementById('cfalse')
//method="GET" action="/tasks"
const li = document.createElement("div")

tasksForm.addEventListener('submit', (event) => {
    event.preventDefault() // Doesn't reload page, as pattern

    var url = "/tasks"

    console.log(sortByCompletedTrue.checked)
    console.log(sortByCompletedFalse.checked)
    
    if (sortByCompletedTrue.checked == true) {
        url = url + "?completed=" + sortByCompletedTrue.value
    } else if (sortByCompletedFalse.checked == true){
        url = url + "?completed=" + sortByCompletedFalse.value
    }
    console.log(url)

    fetch(url).then((response) => {
        sortByCompletedTrue.checked = false
        sortByCompletedFalse.checked = false
        taskListElement.innerHTML = ""
        li.innerHTML = ""
        response.json().then((data) => {
            data.forEach(element => {
                // const deleteForm = document.createElement("form")
                // deleteForm.method = "DELETE"
                // deleteForm.action = "/tasks/" + element._id
                // const deleteButton = document.createElement("button")
                // deleteButton.type = "submit"
                // deleteButton.textContent = "Delete Task"
                // deleteButton.className = "btn btn-sm btn-outline-danger"
                // deleteForm.appendChild(deleteButton)
                const heading = document.createElement("div")
                const h5 = document.createElement("h5")
                const small = document.createElement("small")
                const p = document.createElement("p")
                const description = document.createTextNode(element.description)
                const createdAt = document.createTextNode(element.createdAt)
                const completed = document.createTextNode('Completed: ' + element.completed)
                heading.className = "d-flex w-100 justify-content-between"
                heading.appendChild(h5)
                heading.appendChild(small)
                li.className = "list-group-item"
                li.appendChild(heading)
                li.appendChild(p)
                // li.appendChild(deleteForm)
                h5.appendChild(description)
                small.appendChild(createdAt)
                p.appendChild(completed)
                taskListElement.append(li)
                console.log(li)
            });
        })
    })
})
