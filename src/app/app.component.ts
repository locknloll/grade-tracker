import { Component, OnInit } from '@angular/core';

import { Course } from './course';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'grade-tracker';

  courses: Course[] = [];

  constructor(private store: AngularFirestore) { }

  ngOnInit(): void {
    this.getCourses().subscribe((courses: Course[]) => { 
      this.courses = courses;
      console.log("courses = " + JSON.stringify(courses));
    });
  }

  getCourses(): Observable<Course[]> {
    return this.store.collection('course').valueChanges({ idField: 'id' }) as Observable<Course[]>;
  }
}