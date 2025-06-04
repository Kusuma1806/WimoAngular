import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../common.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'landing',
  imports: [RouterLink,CommonModule,HeaderComponent,FooterComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent{
  constructor(private commonService:CommonService){}
  userName: string | null = null;

  get isLoggedIn():boolean{
    if(this.commonService.getToken()){
      this.userName = localStorage.getItem('username'); // ✅ Get username from local storage
      return true;
    }
    else{
      return this.commonService.logStatus();
    }
}

}