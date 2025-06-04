import { Component } from '@angular/core';
import { RouterLink} from '@angular/router';
import { CommonService } from '../common.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [RouterLink,CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  constructor(private commonService:CommonService){}
  get isLoggedIn():boolean{
    if(this.commonService.getToken()){
      return true;
    }
    else{
      return this.commonService.logStatus();
    }
   
  }
}