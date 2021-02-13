let a=document.querySelectorAll('.mg');
let b=document.querySelectorAll('.tbldiv');
for(let i=0;i<2;i++){
     a[i].addEventListener('click',()=>{
         b[i].style.display='block';
         b[(i+1)%2].style.display='none';
         a[i].style.boxShadow='0 0 10px sandybrown';
         a[(i+1)%2].style.boxShadow=''
     })
}