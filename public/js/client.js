//Load Client side JavaScript
console.log("JavaScript Loaded!")


function checkValue()
{
  var checkbox = document.getElementById('checkbox');
  checkbox.value = checkbox.checked
}

// function addCompleted(){

//   var link = document.getElementById('page')
//   // Stop the link from redirecting
//   link.preventDefault();

//   var completed = document.URL.split('=')
//   console.log(completed)

//   // Redirect instead with JavaScript
//   window.location.href = link.href + '&completed=' + completed[1];
// }

// // Select our Get Tasks form
// const tasksForm = document.querySelector('#getTasks') // Selects form HTML element
// // console.log(tasksForm)
// const taskListElement = document.querySelector('#ul')
// var sortByCompletedTrue = document.getElementById('ctrue')
// var sortByCompletedFalse = document.getElementById('cfalse')
// //method="GET" action="/tasks"
// const li = document.createElement("div")

// if (tasksForm) {
//     tasksForm.addEventListener('submit', (event) => {
//         event.preventDefault() // Doesn't reload page, as pattern
    
//         var url = "/tasks"
    
//         console.log(sortByCompletedTrue.checked)
//         console.log(sortByCompletedFalse.checked)
        
//         if (sortByCompletedTrue.checked == true) {
//             url = url + "?completed=" + sortByCompletedTrue.value
//         } else if (sortByCompletedFalse.checked == true){
//             url = url + "?completed=" + sortByCompletedFalse.value
//         }
//         console.log(url)
    
//         fetch(url).then((response) => {
//             sortByCompletedTrue.checked = false
//             sortByCompletedFalse.checked = false
//             taskListElement.innerHTML = ""
//             li.innerHTML = ""
//             response.json().then((data) => {
//                 data.forEach(element => {
//                     const updateForm = document.createElement("form")
//                     updateForm.method = "POST"
//                     updateForm.action = "/tasks/" + element._id + "?_method=PATCH"
//                     const editButton = document.createElement("button")
//                     editButton.type = "submit"
//                     editButton.textContent = "Update Task"
//                     editButton.className = "btn btn-sm btn-outline-primary"
//                     const deleteForm = document.createElement("form")
//                     deleteForm.method = "POST"
//                     deleteForm.action = "/tasks/" + element._id + "?_method=DELETE"
//                     const deleteButton = document.createElement("button")
//                     deleteButton.type = "submit"
//                     deleteButton.textContent = "Delete Task"
//                     deleteButton.className = "btn btn-sm btn-outline-danger"
//                     deleteForm.appendChild(deleteButton)
//                     const heading = document.createElement("div")
//                     const input = document.createElement("input")
//                     const checkbox = document.createElement("input")
//                     checkbox.type = "check"
//                     const completed = document.createTextNode('Completed: ' + element.completed)
//                     heading.className = "d-flex w-100 justify-content-between"
//                     heading.appendChild(input)
//                     li.className = "list-group-item"
//                     updateForm.appendChild(input)
//                     updateForm.appendChild(checkbox)
//                     li.appendChild(heading)
//                     li.appendChild(checkbox)
//                     li.appendChild(deleteForm)
//                     input.value = element.description
//                     checkbox.appendChild(completed)
//                     li.appendChild(updateForm)
//                     updateForm.appendChild(editButton)
//                     taskListElement.append(li)
//                     console.log(li)
//                 });
//             })
//         })
//     })
// }

// const avatarDiv = document.getElementById('avatarDiv')

// window.onload = function() { 
//     const response = document.forms['avatarForm'].submit();
//     const img = document.getElementById('avatar')
//     img.src = response
//     console.log(response)
//     avatarDiv.appendChild(img)
// }