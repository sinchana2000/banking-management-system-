let a=document.querySelectorAll('.emoji');
let emoj= function(j,k,l){
    let b=document.createElement('input');
            if(a[j].children.length < 2){
               a[j].append(b);
            }
             a[j].style.color=k;
             a[j].children[1].type="hidden";
            a[j].children[1].value=l;
             a[j].children[1].name="feedback";
            a[(j+1)%3].style.color='black';
             a[(j+2)%3].style.color='black';
             if(a[(j+1)%3].children.length == 2){
                a[(j+1)%3].children[1].remove();
            }
           if(a[(j+2)%3].children.length == 2){
                a[(j+2)%3].children[1].remove();
            }
}

for(let i=0;i<3;i++){
    a[i].addEventListener('click',()=>{
        if(i==0){
            emoj(i,"#43f736","very good");
           
        }
         if(i==1){
           emoj(i,"orange","average");
        }
         if(i==2){
         emoj(i,"red","very bad");
           
        }
    })
}