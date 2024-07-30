const typingForm=document.querySelector(".typing-form");
const chatList=document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton=document.querySelector("#toggle-theme");
const deleteChatButton=document.getElementById("delete-chat-button");

let userMessage=null;
let isresponsegenerating = false;

const API_KEY="AIzaSyBYXE49A8YYJJ4SkmwAhGfhTDEmiCjCHgc";
const API_URL=`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`

const loadLocalStorage=()=>{
    const savedChats=localStorage.getItem("savedChats");
    const isLightMode=(localStorage.getItem("themeColor")==="light_mode");

    document.body.classList.toggle("light_mode",isLightMode);
    toggleThemeButton.innerText=isLightMode?"dark_mode":"light_mode";
    chatList.innerHTML=savedChats || "";
    document.body.classList.toggle("hide-header",savedChats);
    chatList.scrollTo(0,chatList.scrollHeight);

}
loadLocalStorage();




//create a neww message element and return it
const createMessageElement=(content,...className)=>{
    const div=document.createElement("div");
    div.classList.add("message",...className);
    div.innerHTML=content;
    return div;


}
const showTypingEffect=(text,textElement,incomingMessageDiv)=>{
    const words=text.split(' ');
    let currentWordIndex=0;


    const typingInterval=setInterval(()=>{
        textElement.innerText+=(currentWordIndex === 0 ? '' :' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        
        if(currentWordIndex === words.length){
            isresponsegenerating = false;
            clearInterval(typingInterval);
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats",chatList.innerHTML);
        }           
        chatList.scrollTo(0,chatList.scrollHeight);


    },75);


}




const generateAPIResponse= async(incomingMessageDiv)=>{
    const textElement=incomingMessageDiv.querySelector(".text");


    try{
        const response=await fetch(API_URL,{
            method:"POST",
            headers:{ "Content-Type": "application/json"},
            body:JSON.stringify({
                contents:[{
                    role:"user",
                    parts:[{text:userMessage}]
                }]
            })
        });
        const data=await response.json();
        if(!response.ok) throw new Error(data.error.message);
        const apiResponse=data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
        showTypingEffect(apiResponse,textElement,incomingMessageDiv);

    }catch(error){
        isresponsegenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }finally{
        incomingMessageDiv.classList.remove("loading");
    }

}

//show a laoding animation while waiting for the api response
const showLoadingAnimation=()=>{
    const html=` <div class="message-content">
                <img src="images/gemini.svg" alt="gemini" class="avatar">
                <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">
                content_copy
            </span>`;
const incomingMessageDiv=createMessageElement(html,"incoming","loading");
chatList.append(incomingMessageDiv);
chatList.scrollTo(0,chatList.scrollHeight);

generateAPIResponse(incomingMessageDiv);

}
const copyMessage=(copyIcon)=>{
    const messageText=copyIcon.parentElement.querySelector(".text").innerText;


    navigator.clipboard.writeText(messageText)
    copyIcon.innerText="done";
    setTimeout(()=>copyIcon.innerText="content_copy",1000)
}



const handleOutgoingChat=()=>{
    userMessage=typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isresponsegenerating) return;

    isresponsegenerating = true;
const html=` <div class="message-content">
                <img src="images/user.jpg" alt="user" class="avatar">
                <p class="text"></p>
            </div>`;
    const outgoingMessageDiv=createMessageElement(html,"outgoing");
    outgoingMessageDiv.querySelector(".text").innerText=userMessage;
    chatList.append(outgoingMessageDiv);
    typingForm.reset();//clear input field
    chatList.scrollTo(0,chatList.scrollHeight);

    document.body.classList.add("hide-header");

    setTimeout(showLoadingAnimation,500);//show loading animation after a delay
}

suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click",()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
})

toggleThemeButton.addEventListener("click",()=>{
    const isLightMode=document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor",isLightMode?"light_mode":"dark_mode");
    toggleThemeButton.innerText=isLightMode?"dark_mode":"light_mode";

})

deleteChatButton.addEventListener("click",()=>{
    if(confirm("Are you sure you want to delete all mesaages?")){
        localStorage.removeItem("savedChats");
    loadLocalStorage();
    }

});

typingForm.addEventListener("submit",(e)=>{
    e.preventDefault();

    handleOutgoingChat();
})