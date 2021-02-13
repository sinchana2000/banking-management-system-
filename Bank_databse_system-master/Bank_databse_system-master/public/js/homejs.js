let loan=document.querySelectorAll('.card');
let i=1;
setInterval(()=>{
    if(i!=0){
        loan[i-1].classList.add('dis');
    }
    if(i==0){
        loan[2].classList.add('dis');
    }
    loan[i].classList.remove('dis'); 
    i+=1;
    if(i==3){
        i=0;
    }
},3000) 







