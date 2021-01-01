"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function validate({ value, required, minLength, maxLength, min, max }) {
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
function autobind(_, _2, descriptor) {
    const originalMethod = descriptor.value;
    const adjustedDecorator = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjustedDecorator;
}
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
class ProjectState extends State {
    constructor() {
        super();
        this.projects = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
    addProject(title, description, people) {
        const newProject = new Project(new Date().getTime().toString(), title, description, people, ProjectStatus.onprogress);
        this.projects.push(newProject);
        this.updateListeners();
    }
    moveProject(projectId, newStatus) {
        const project = this.projects.find(project => project.id === projectId);
        if (project && project.status !== ProjectStatus[newStatus]) {
            project.status = ProjectStatus[newStatus];
            this.updateListeners();
        }
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
const projectState = ProjectState.getInstance();
class ComponentRender {
    constructor(templateId, hostId, isAfterBegin, newElId) {
        this.templateEl = document.getElementById(templateId);
        this.hostEl = document.getElementById(hostId);
        const importedContentNode = document.importNode(this.templateEl.content, true);
        this.el = importedContentNode.firstElementChild;
        !!newElId && (this.el.id = newElId);
        this.attach(isAfterBegin);
    }
    attach(isAfterBegin) {
        this.hostEl.insertAdjacentElement(isAfterBegin ? 'afterbegin' : 'beforeend', this.el);
    }
}
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["onprogress"] = "onprogress";
    ProjectStatus["done"] = "done";
})(ProjectStatus || (ProjectStatus = {}));
class Project {
    constructor(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
}
class ProjectInput extends ComponentRender {
    constructor() {
        super('project-input', 'app', true, 'user-input');
        this.titleInputEl = this.el.querySelector('#title');
        this.descriptionInputEl = this.el.querySelector('#description');
        this.peopleInputEl = this.el.querySelector('#people');
        this.configure();
    }
    configure() {
        this.el.addEventListener('submit', this.submitHandler);
    }
    renderContent() { }
    getUserInput() {
        const title = this.titleInputEl.value;
        const desc = this.descriptionInputEl.value;
        const people = this.peopleInputEl.value;
        const titleValidator = { value: title, required: true };
        const descValidator = { value: desc, required: true, minLength: 8 };
        const peopleValidator = { value: +people, required: true, min: 1, max: 10 };
        const postfix = `, please try again!`;
        const titleValidation = validate(titleValidator);
        const descValidation = validate(descValidator);
        const peopleValidation = validate(peopleValidator);
        if (titleValidation.message || !titleValidation.valid) {
            alert(`title error: ${titleValidation.message}${postfix}`);
        }
        else if (descValidation.message || !descValidation.valid) {
            alert(`description error: ${descValidation.message}${postfix}`);
        }
        else if (peopleValidation.message || !peopleValidation.valid) {
            alert(`people error: ${peopleValidation.message}${postfix}`);
        }
        else {
            return [title, desc, +people];
        }
    }
    resetForm() {
        this.titleInputEl.value = '';
        this.descriptionInputEl.value = '';
        this.peopleInputEl.value = '';
    }
    submitHandler(event) {
        event.preventDefault();
        const userInput = this.getUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            this.resetForm();
        }
    }
}
__decorate([
    autobind
], ProjectInput.prototype, "submitHandler", null);
class ProjectItem extends ComponentRender {
    constructor(project, hostId) {
        super('single-project', hostId, false);
        this.project = project;
        this.configure();
    }
    get persons() {
        const { people } = this.project;
        return `${people} person${people > 1 ? 's' : ''}`;
    }
    ;
    dragStartHandler(event) {
        event.dataTransfer.setData('text/plain', this.project.id);
        event.dataTransfer.effectAllowed = 'move';
    }
    ;
    dragEndHandler(_) {
        console.log('DragEnd');
    }
    ;
    configure() {
        this.el.draggable = true;
        this.el.addEventListener('dragstart', this.dragStartHandler);
        this.el.addEventListener('dragend', this.dragEndHandler);
    }
    ;
    setElTextContent(selector, text) {
        this.el.querySelector(selector).textContent = text;
    }
    createElement() {
        this.el.classList.add(`${this.project.status}-${new Date().getTime()}`);
        this.setElTextContent('h2', this.project.title);
        this.setElTextContent('h3', `${this.persons} assigned`);
        this.setElTextContent('p', this.project.description);
        return this.el;
    }
    ;
    renderContent() {
        this.hostEl.appendChild(this.createElement());
    }
    ;
}
__decorate([
    autobind
], ProjectItem.prototype, "dragStartHandler", null);
class ProjectList extends ComponentRender {
    constructor(type) {
        super('project-list', 'app', false, `${ProjectStatus[type]}-projects`);
        this.type = type;
        this.assignedProjects = [];
        this.configure();
        this.renderContent();
    }
    get projectListUL() {
        return this.el.querySelector('ul');
    }
    dragOverHandler(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            this.projectListUL.classList.add('droppable');
        }
    }
    dropHandler(event) {
        const dataId = event.dataTransfer.getData('text/plain');
        projectState.moveProject(dataId, ProjectStatus[this.type]);
    }
    dragLeaveHandler(_) {
        this.projectListUL.classList.remove('droppable');
    }
    renderProjects() {
        const listId = `${ProjectStatus[this.type]}-projects-list`;
        const listEl = document.getElementById(listId);
        listEl.innerHTML = '';
        for (const item of this.assignedProjects) {
            const projectItem = new ProjectItem(item, listId);
            projectItem.renderContent();
        }
    }
    renderContent() {
        const listId = `${ProjectStatus[this.type]}-projects-list`;
        this.el.querySelector('ul').id = listId;
        this.el.querySelector('h2').textContent = ProjectStatus[this.type].toUpperCase();
    }
    configure() {
        this.el.addEventListener('dragover', this.dragOverHandler);
        this.el.addEventListener('dragleave', this.dragLeaveHandler);
        this.el.addEventListener('drop', this.dropHandler);
        projectState.addListener((projects) => {
            const filteredProjects = projects.filter(project => {
                return project.status === this.type;
            });
            this.assignedProjects = filteredProjects;
            this.renderProjects();
        });
    }
}
__decorate([
    autobind
], ProjectList.prototype, "dragOverHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dropHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dragLeaveHandler", null);
const projectInput = new ProjectInput();
const onprogressProjects = new ProjectList(ProjectStatus.onprogress);
const doneProjects = new ProjectList(ProjectStatus.done);
//# sourceMappingURL=app.js.map