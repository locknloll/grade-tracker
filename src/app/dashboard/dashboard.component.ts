import { Component, OnInit } from '@angular/core';
import { Course } from '../course';
import { Item } from '../item';

import * as jsonata from 'jsonata';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { CourseDialogComponent, CourseDialogResult } from '../course-dialog/course-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  items: Item[] = [];
  courses: Course[] = [];
  courseMetrics: any = {};
  groupedItems: any = {};
  displayedColumns = ['number','name','creditHours','grade','actions'];

  constructor(private store: AngularFirestore,
              private dialog: MatDialog) { }

  ngOnInit(): void {
    this.getCourses().subscribe((courses: Course[]) => { 
      this.courses = courses;
    });
    this.getItems().subscribe((items: Item[]) => { 
      this.courseMetrics = this.getCourseMetrics(items);
      this.groupedItems = this.groupItems(items);
      this.items = items; 
    });
  }

  getItems(): Observable<Item[]> {
    return this.store.collection('item').valueChanges({ idField: 'id' }) as Observable<Item[]>;
  }

  getCourses(): Observable<Course[]> {
    return this.store.collection('course').valueChanges({ idField: 'id' }) as Observable<Course[]>;
  }

  newCourse(): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '350px',
      data: { course: {} },
    });
    dialogRef.afterClosed()
      .subscribe((result: CourseDialogResult | undefined) => {
      if (!result) {
        return;
      }
      this.store.collection('course')
      .add(result.course);
    });
  }

  editCourse(course: Course): void {
    const oldCourseNo = course.number;
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '350px',
      data: { course },
    });
    dialogRef.afterClosed()
      .subscribe((result: CourseDialogResult | undefined) => {
      if (!result) {
        return;
      }
      this.store.collection('course').doc(course.id).update(course);
      this.groupedItems[oldCourseNo].forEach((item: Item) => {
        item.course = course;
        this.store.collection('item').doc(item.id).update(item);
      });
    });
  }

  deleteCourse(course: Course) {
    this.store.collection('course').doc(course.id).delete();
    this.groupedItems[course.number].forEach((item: Item) => {
      this.store.collection('item').doc(item.id).delete();
    });
  }

  groupItems(items: Item[]): void {
    const groupItemsJsonata = `
    (
      $courses := $distinct($.course.number);
      $groupItemsByCourse := function($c) {
        { 
          $c: [$[course.number=$c].$sift(function($v, $k) {
            $k ~> /^(id)/
          })]
        }
      };
      $count($) > 0 ? $merge($courses.$groupItemsByCourse($)) : {}
    )`;
    const exp = jsonata(groupItemsJsonata);
    return exp.evaluate(items);
  }

  getCourseMetrics(items: Item[]): void {
    const jsonataString = `
    (
      $courses := $distinct($.course);
      $getCourseMetrics := function($c) {
        (
          $items := $[course.name=$c.name];
          $weightTotal := $sum($items.weight);
          $grade := $round($sum($items.$itemizedGrade($, $weightTotal))*100,2);
          {
            $c.number: {
              "name": $c.name,
              "number": $c.number,
              "creditHours": $c.creditHours,
              "grade": $grade >= 90 ? "A" : $grade >= 80 ? "B" : $grade >= 70 ? "C" : $grade >= 60 ? "D" : "F",
              "gpa": $grade >= 90 ? 4 : $grade >= 80 ? 3 : $grade >= 70 ? 2 : $grade >= 60 ? 1 : 0
            }
          }
        )
      };
      $itemizedGrade := function($i, $wt) {
          $i.grade/$i.outOf*$i.weight/$wt
      };
      $calcGpa := function($cm) {
        (
          $quotient := $cm.($.*.creditHours * $.*.gpa);
          $divisor := $sum($cm.*.creditHours);
          $round($sum($quotient)/$divisor, 2)
        )
      };
      $courseMetrics := $courses.$getCourseMetrics($);
      $merge($append({"gpa": $calcGpa($courseMetrics)}, $courseMetrics))
    )`;
    const exp = jsonata(jsonataString);
    return exp.evaluate(items);
  }
}
