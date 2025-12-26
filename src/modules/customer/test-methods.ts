import CustomerModuleService from "./service"

// Виводимо всі методи сервісу
const service = CustomerModuleService.prototype
console.log("Available methods:")
console.log(Object.getOwnPropertyNames(service))
