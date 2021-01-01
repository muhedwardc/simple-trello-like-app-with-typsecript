// Drag and drop
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}


interface ValidatorInterface {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number
}

interface ValidationResponse {
    valid: boolean,
    message: string
}

function validate({ 
    value, 
    required, 
    minLength, 
    maxLength, 
    min, 
    max
}: ValidatorInterface): ValidationResponse {
    let valid = true;
    let message = '';

    if (required && value.toString().trim().length <= 0) {
        valid = false;
        message = 'required';
    }
    if (minLength != null && typeof value === 'string' && value.trim().length < minLength) {
        valid = false;
        message = `minimum ${minLength} character${minLength > 1 ? 's' : ''}`;
    }
    if (maxLength != null && typeof value === 'string' && value.trim().length > maxLength) {
        valid = false;
        message = `minimum ${maxLength} character${maxLength > 1 ? 's' : ''}`;
    }
    if (min != null && typeof value === 'number' && value < min) {
        valid = false;
        message = `should more than or equal to ${min}`;
    }
    if (max != null && typeof value === 'number' && value > max) {
        valid = false;
        message = `should lower than or equal to ${max}`;
    }

    return { valid, message };
}

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDecorator: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjustedDecorator;
}

// Project State
type Listener<T> = (items: T[]) => void;

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        } 

        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: Listener<Project>) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, people: number) {
        const newProject = new Project(
            new Date().getTime().toString(),
            title,
            description,
            people,
            ProjectStatus.onprogress
        )
        this.projects.push(newProject);
        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find(project => project.id === projectId);
        if (project && project.status !== ProjectStatus[newStatus]) {
            project.status = ProjectStatus[newStatus];
            this.updateListeners();
        }
    }

    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

// base component render
abstract class ComponentRender<T extends HTMLElement, U extends HTMLElement> {
    templateEl: HTMLTemplateElement;
    hostEl: T;
    el: U;

    constructor(templateId: string, hostId: string, isAfterBegin: boolean, newElId?: string) {
        this.templateEl = <HTMLTemplateElement>document.getElementById(templateId)!;
        this.hostEl = <T>document.getElementById(hostId)!;

        const importedContentNode = document.importNode(this.templateEl.content, true);
        this.el = <U>importedContentNode.firstElementChild;
        !!newElId && (this.el.id = newElId);

        this.attach(isAfterBegin);
    }

    private attach(isAfterBegin: boolean) {
        this.hostEl.insertAdjacentElement(
            isAfterBegin ? 'afterbegin' : 'beforeend', 
            this.el
        );
    }

    abstract configure?(): void;
    abstract renderContent(): void;
}

enum ProjectStatus { onprogress = 'onprogress', done = 'done' }

class Project {
    constructor(
        public id: string, 
        public title: string, 
        public description: string, 
        public people: number,
        public status: ProjectStatus
    ) {}
}

class ProjectInput extends ComponentRender<HTMLDivElement, HTMLFormElement>{
    titleInputEl: HTMLInputElement;
    descriptionInputEl: HTMLTextAreaElement;
    peopleInputEl: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input');

        this.titleInputEl = <HTMLInputElement>this.el.querySelector('#title')!
        this.descriptionInputEl = <HTMLTextAreaElement>this.el.querySelector('#description')!
        this.peopleInputEl = <HTMLInputElement>this.el.querySelector('#people')!

        this.configure();
    }

    configure() {
        this.el.addEventListener('submit', this.submitHandler);
    }

    renderContent() {}

    private getUserInput(): [string, string, number] | void {
        const title = this.titleInputEl.value;
        const desc = this.descriptionInputEl.value;
        const people = this.peopleInputEl.value;

        const titleValidator: ValidatorInterface = { value: title, required: true}; 
        const descValidator: ValidatorInterface = { value: desc, required: true, minLength: 8}; 
        const peopleValidator: ValidatorInterface = { value: +people, required: true, min: 1, max: 10}; 

        const postfix = `, please try again!`;
        const titleValidation = validate(titleValidator);
        const descValidation = validate(descValidator);
        const peopleValidation = validate(peopleValidator);

        if (titleValidation.message || !titleValidation.valid) {
            alert(`title error: ${titleValidation.message}${postfix}`)
        } else if (descValidation.message || !descValidation.valid) {
            alert(`description error: ${descValidation.message}${postfix}`)
        } else if (peopleValidation.message || !peopleValidation.valid) {
            alert(`people error: ${peopleValidation.message}${postfix}`)
        } else {
            return [title, desc, +people];
        }
    }

    private resetForm() {
        this.titleInputEl.value = '';
        this.descriptionInputEl.value = '';
        this.peopleInputEl.value = '';
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();

        const userInput = this.getUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            this.resetForm();
        }
    }
}

class ProjectItem extends ComponentRender<HTMLDivElement, HTMLElement> implements Draggable {
    private project: Project;

    get persons(): string {
        const { people } = this.project;
        return `${people} person${people > 1 ? 's' : ''}`
    }

    constructor(project: Project, hostId: string) {
        super('single-project', hostId, false);
        this.project = project;
        this.configure();
    };

    @autobind
    dragStartHandler(event: DragEvent) {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    };

    dragEndHandler(_: DragEvent) { 
        console.log('DragEnd')
    };

    configure() {
        this.el.draggable = true;
        this.el.addEventListener('dragstart', this.dragStartHandler);
        this.el.addEventListener('dragend', this.dragEndHandler);
    };

    private setElTextContent(selector: string, text: string) {
        this.el.querySelector(selector)!.textContent = text;
    }

    createElement(): HTMLElement {
        this.el.classList.add(`${this.project.status}-${new Date().getTime()}`);
        this.setElTextContent('h2', this.project.title);
        this.setElTextContent('h3', `${this.persons} assigned`);
        this.setElTextContent('p', this.project.description);
        return this.el;
    };

    renderContent() {
        this.hostEl.appendChild(this.createElement());
    };
}

class ProjectList extends ComponentRender<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[] = [];

    get projectListUL(): HTMLUListElement {
        return <HTMLUListElement>this.el.querySelector('ul')!
    }

    constructor(private type: ProjectStatus) {
        super('project-list', 'app', false, `${ProjectStatus[type]}-projects`);

        this.configure();
        this.renderContent();
    }

    @autobind
    dragOverHandler(event: DragEvent) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            this.projectListUL.classList.add('droppable');
        }
    }

    @autobind
    dropHandler(event: DragEvent) {
        const dataId = event.dataTransfer!.getData('text/plain');
        projectState.moveProject(dataId, ProjectStatus[this.type]);
    }

    @autobind
    dragLeaveHandler(_: DragEvent) {
        this.projectListUL.classList.remove('droppable');
    }

    private renderProjects() {
        const listId = `${ProjectStatus[this.type]}-projects-list`;
        const listEl = <HTMLUListElement>document.getElementById(listId)!;
        listEl.innerHTML = '';
        for(const item of this.assignedProjects) {
            const projectItem = new ProjectItem(item, listId);
            projectItem.renderContent();
        }
    }

    renderContent() {
        const listId = `${ProjectStatus[this.type]}-projects-list`;
        this.el.querySelector('ul')!.id = listId;
        this.el.querySelector('h2')!.textContent = ProjectStatus[this.type].toUpperCase();
    }

    configure(){
        this.el.addEventListener('dragover', this.dragOverHandler);
        this.el.addEventListener('dragleave', this.dragLeaveHandler);
        this.el.addEventListener('drop', this.dropHandler);

        projectState.addListener((projects: Project[]) => {
            const filteredProjects = projects.filter(project => {
                return project.status === this.type;
            });
            this.assignedProjects = filteredProjects;
            this.renderProjects();
        });
    }
}

const projectInput = new ProjectInput();
const onprogressProjects = new ProjectList(ProjectStatus.onprogress);
const doneProjects = new ProjectList(ProjectStatus.done);