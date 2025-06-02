export class CreateCourseDto {
    name: string;
    period: number;
    shift: 'matutino' | 'vespertino' | 'noturno' | 'integral';
    className: string;
}

