import { LoggerService } from './logger/logger.service.js';

function Component(id: number) {
	console.log('init component');
	return function(target: Function) {
		console.log('run component');
		target.prototype.id = id;
	};
}

function Logger() {
	const logger = new LoggerService();
	logger.log('init logger');
	return function(target: Function) {
		logger.log('run logger');
	};
}

function Method(
	target: Object,
	propertyKey: string,
	propertyDescriptor: PropertyDescriptor,
) {
	console.log(propertyKey);
	
	const oldValue = propertyDescriptor.value;
	
	propertyDescriptor.value = function(...args: any[]) {
		oldValue.apply(target, args);
		if (typeof args[0] === 'number') {
			return args[0] * 2
		}
	};
}

function Prop(
	target: Object,
	propertyKey: string,
) {
	let value: number;
	
	const getter = () => {
		console.log('Get');
		return value;
	}
	
	const setter = (newValue: number) => {
		console.log('Set');
		value = newValue;
	}
	
	Object.defineProperty(target, propertyKey, {
		get: getter,
		set: setter,
	})
}

function Param(
	target: Object,
	propertyKey: string,
	index: number,
) {
	console.log(target, propertyKey, index);
}

@Logger()
@Component(1)
class User {
	@Prop id: number;
	
	@Method
	updateID(@Param newId: number): number {
		this.id = newId;
		return this.id;
	}
}

console.log(new User().id);
console.log(new User().updateID(25));