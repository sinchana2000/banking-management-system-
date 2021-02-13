let login=document.querySelectorAll('.login');
let box= document.querySelectorAll('.box');

for(let i=0;i<3;i++){
    box[i].addEventListener('click',()=>{
    box[i].style.backgroundColor='white';
    box[i].style.color='green';
    login[i].classList.remove('disp');

    login[(i+1)%3].classList.add('disp');
    login[(i+2)%3].classList.add('disp');
    box[(i+1)%3].style.backgroundColor='green';
    box[(i+2)%3].style.backgroundColor='green';
    box[(i+1)%3].style.color='white';
    box[(i+2)%3].style.color='white';

})

}



