export default null;

/** @type {HTMLDialogElement} */
const dialog_ = document.querySelector(".yt_photo_magnifier.dialog")
    
/** @type {HTMLButtonElement} */
const button_close_dialog = document.querySelector(".yt_photo_magnifier.dialog #button_close_dialog")

/** @type {Array<HTMLInputElement>} */
const input_all = Array.from(document.querySelectorAll(".yt_photo_magnifier.dialog input:not( [type = button] )"))

/** @type {HTMLInputElement} */
const input_cancel_key = document.querySelector(".yt_photo_magnifier.dialog #input_cancel_key")

/** @type {HTMLInputElement} */
const input_clear_cancel_key = document.querySelector(".yt_photo_magnifier.dialog #input_clear_cancel_key")

/** @type {HTMLInputElement} */
const input_quality = document.querySelector(".yt_photo_magnifier.dialog #input_quality")

/** @type {HTMLInputElement} */
const input_size = document.querySelector(".yt_photo_magnifier.dialog #input_size")

//

dialog_.setAttribute("open", "")
dialog_.className = dialog_.className + " " + "open"

button_close_dialog.addEventListener( "click", function(event = MouseEvent.prototype)
{
    dialog_.className = Array.from(dialog_.classList).map( (classItem = String.prototype) => classItem.replace("open", "close") ).join(" ")
    dialog_.addEventListener( 'animationend', function(){ this.parentNode.remove() } , {once: true} )
} )

input_clear_cancel_key.addEventListener( "click", function(event = MouseEvent.prototype)
{
    input_cancel_key.value = null
    localStorage.setItem( input_cancel_key.name, input_cancel_key.value )
} )

input_cancel_key.addEventListener( "keydown", function(event = KeyboardEvent.prototype)
{
    if ( event.repeat )
        return;

    if ( event.key === "Dead" )
        return;

    if ( event.code === "Space" )
        this.value = event.code
    else
        this.value = event.key.length > 1 ? event.key : event.key.toUpperCase()

    event.preventDefault()
} )

input_all.forEach( input =>
{
    const CookieIt = (name = String.prototype) => "__" + name
    const {name} = input

    if ( localStorage.getItem( CookieIt(name) ) )
        this.value = localStorage.getItem( CookieIt(name) )

    input.addEventListener( "input", function()
    {
        localStorage.setItem( CookieIt(name), this.value )
    } )
} )