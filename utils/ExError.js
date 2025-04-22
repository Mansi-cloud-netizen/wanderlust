class ExError extends Error{
    constructor(statusCode,message){
        this.status=statusCode;
        this.message=message;
    }
}
module.exports=ExError;