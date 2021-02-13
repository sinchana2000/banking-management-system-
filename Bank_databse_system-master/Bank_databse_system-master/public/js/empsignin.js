let login=document.querySelectorAll('.login');
let box= document.querySelectorAll('.box');
console.log(login);
for(let i=0;i<2;i++){
    box[i].addEventListener('click',()=>{
    box[i].style.backgroundColor='white';
    box[i].style.color='green';
    login[i].classList.remove('disp');

    login[(i+1)%2].classList.add('disp');
  
    box[(i+1)%2].style.backgroundColor='green';
    
    box[(i+1)%2].style.color='white';
    

})

}