// ==UserScript==

// @name            Youtube Photo Magnifier
// @version         4.0
// @description     Make profile photos and thumbnails larger by hover it and cancel it by pressing (ctrl) or by click it!
// @author          Ruan Moreira de Jesus

// @match           *://www.youtube.com/*

// @grant           window.onurlchange
// @grant           GM_getResourceText

// @resource        INTERFACE_JS http://127.0.0.1:5500/interface.js
// @resource        INTERFACE_CSS http://127.0.0.1:5500/interface.css
// @resource        INTERFACE_HTML http://127.0.0.1:5500/interface.html

// ==/UserScript==

//#region "User Data Declaration"

    const get_config_values = (function() {
        /**
         * @param {object} obj
         * @param {String} prop
        **/
        const GetNameOf = ( obj, prop ) => Object.keys(obj).find( e => e.search(new RegExp( prop , "i"))+1 )

        /** @param {String} value */
        const CookieIt = ( value ) => "__" + value

        const cookie_manager = window.localStorage

        /** @param {String} key */
        const SetNewCookie = (key) =>
        {
            /** @param {String} value */
            return ( value ) => cookie_manager.setItem( key, value )
        }

        /**
         * @param {String} key
         * @returns {String}
        **/
        const GetNewCookie = (key) =>
        {
            cookie_manager.getItem( key )
        }

        const __configs = {
            yt_avatar_cancel_key: "ctrl"
            , yt_avatar_max_quality: 4
            , yt_avatar_max_size_per_cent: 50
        }

        const prop_cancel_key = GetNameOf(__configs, "cancel_key")
        const prop_size = GetNameOf(__configs, "max_size")
        const prop_quality = GetNameOf(__configs, "max_quality")

        const cookie_cancel_key = CookieIt(prop_cancel_key)
        const cookie_size = CookieIt(prop_size)
        const cookie_quality = CookieIt(prop_quality)

        const __bpp_config = Object.freeze({
            reset(){
                this.maxSize = __configs[prop_size]
                this.maxQuality = __configs[prop_quality]

                return true
            }
            ,
            /** @param {String} newValue */
            set cancelKey(newValue){ SetNewCookie(cookie_cancel_key)(newValue) }
            ,
            /** @param {Number} newValue */
            set maxSize(newValue){ SetNewCookie(cookie_size)(newValue) }
            ,
            /** @param {Number} newValue */
            set maxQuality(newValue){ SetNewCookie(cookie_quality)(newValue) }
        })

        return (
        {
            GetDataInterface: () => __bpp_config
            ,
            /** @returns {String} */
            GetDataCancelKey: () => GetNewCookie(cookie_cancel_key) || __configs[prop_cancel_key]
            ,
            /** @returns {Number} */
            GetDataSizePerCent: () => GetNewCookie(cookie_size) || __configs[prop_size]
            ,
            /** @returns {Number} */
            GetDataMaxQuality: () => ( GetNewCookie(cookie_quality) || __configs[prop_quality] ) * 160
        })
    })()

    const {GetDataInterface} = get_config_values
    const {GetDataCancelKey, GetDataSizePerCent, GetDataMaxQuality} = get_config_values

    /**
     * @callback IEventListenerManager
     * @param {String} functionName
     * @returns {void}
    **/

    /**
     * @typedef {Object} IHoverEffect
     * @property {HTMLImageElement} element
     * @property {IEventListenerManager} eventListenerManager
    **/

    /** @type {Array<IHoverEffect>} */
    const images_with_magnify_effect = [];

//#endregion

//#region "Configuration Button Integration"

    (function()
    {
        const id_interface = "yt_photo_magnifier_container"
        const id_button = "yt_photo_magnifier_interface_button"

        function CreateButton()
        {
            const icon_opacity = 0.6

            /** @type {HTMLElement} */
            const button_ = new DOMParser().parseFromString(`
                <button>Youtube Photo Magnifier</button>
            `, "text/html" ).body.firstElementChild

            {
                const icon_button = new DOMParser().parseFromString(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Free 5.15.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/></svg>
                `, "image/svg+xml" ).firstElementChild
        
                icon_button.style.cssText = ( `
                    height: 100%;
    
                    fill: ${getComputedStyle(document.body).color};
                    opacity: ${icon_opacity};
    
                    position: absolute;
                    left: 0;
                    transform: translateX(175%);
                `.replace(/\s+/g, "") )

                button_.firstChild.before( icon_button )
            }
    
            button_.style.cssText = ( `
                width: 100%;
                padding: 16px 0;

                background-color: transparent;

                border: none;
                outline: none;

                font-size: 150%; 

                position: relative;
            `.replace(/\s+/g, "") )
            
            button_.id = id_button
            button_.addEventListener( "click", () => document.querySelector("#" + id_interface) ? null : CreateInterface() )

            return button_    
        }

        function CreateInterface()
        {
            /** @type {HTMLDialogElement} */
            const dialog_ = new DOMParser().parseFromString( GM_getResourceText("INTERFACE_HTML"), "text/html" ).body.firstElementChild


            /** @type {HTMLLinkElement} */
            const style_ = new DOMParser().parseFromString( `
                <style>
                    ${GM_getResourceText("INTERFACE_CSS")}
                </style>
            ` , "text/html" ).head.firstElementChild

            /** @type {HTMLScriptElement} */
            const script_unusable = new DOMParser().parseFromString( `
                <script>
                    ${GM_getResourceText("INTERFACE_JS")}
                </script>
            ` , "text/html" ).head.firstElementChild

            const interface_ = document.createElement("div")
                interface_.id = id_interface
            const shadow_ = interface_.attachShadow( {mode: "open"} )

            const new_script = document.createElement("script")
                new_script.type = "module"
                new_script.textContent = script_unusable.textContent
                    .replace(/querySelector/g, match => `${match}("#${id_interface}").shadowRoot.${match}` )
                    .replace(/this\.parentNode(?=\.remove\(\))/, match => `document.querySelector("#${id_interface}")` )

            shadow_.appendChild(dialog_)
            
            document.body.append( interface_ )

            shadow_.appendChild(style_)
            shadow_.appendChild(new_script)
        }

        function SetupButton()
        {
            const menu_opener = "#avatar-btn"
            const menu_ = "#contentWrapper"
            const menu_last_section = "#sections > :last-child"

            /**
             * @callback IGetter
             * @returns {Element}
            **/
    
            /** @type {IGetter} */
            const GetMenuOpener = () => document.querySelector(menu_opener).parentElement
            /** @type {IGetter} */
            const GetMenuPosition = () => document.querySelector(menu_).querySelector(menu_last_section)
    
            /**
             * @param {IGetter} getter
             * @returns {Promise<Element>}
            **/
            const WhenLoadElement = function( getter )
            {
                const max_call_number = 60
                let current_call_try = 0
    
                return new Promise( (resolve, reject) =>
                {
                    const interval_ = setInterval( Trier, 1000 )
    
                    function Trier()
                    {
                        try {
                            resolve( getter() )
                        } catch {
                            current_call_try++
    
                            if ( current_call_try <= max_call_number )
                                return
                            
                            reject( "Max Call Stack Reached! To avoid more process consume on this page, it stopped!" )
                        } finally {
                            clearInterval( interval_ )
                        }
                    }
                })
            }
    
            WhenLoadElement(GetMenuOpener).then( button =>
            {
                window.addEventListener( "urlchange", () => {
                    try {
                        document.querySelector("#" + id_button).remove()
                    } catch{}
                }, {once: true} )

                const new_button = CreateButton()

                button.addEventListener( "click", function AddYoutubePhotoMagnifierButton()
                {
                    WhenLoadElement(GetMenuPosition).then( position => position.before( new_button ) )
                } )
            } )
        }

        SetupButton()
    })()

//#endregion

//#region "Common Functions"

    /**
     * @param {HTMLImageElement} image
     * @param {String} srcOrigin
     * @param {Number} maxQuality
    **/
    const ChangeImageSrc = function(image, srcOrigin, maxQuality)
    {
        const new_size = parseInt(maxQuality).toString()

        const string_regex_size_with_dash_finder = /(?<=\=\-\w)/.source
        const string_regex_size_without_dash_finder = /(?<=\=\w)/.source
        const string_regex_max_size = /\d+/.source

        const regex_size_finder = new RegExp( `
            (?:
            ${string_regex_size_with_dash_finder}
            |
            ${string_regex_size_without_dash_finder}
            )
            ${string_regex_max_size}
        `.replace(/\s+/g, "") )
        const src_with_new_size = srcOrigin.replace(regex_size_finder, new_size)

        const string_regex_behind_look_parentheses_finder = /\)(?=\||\))/g
        const regex_last_param_non_quality_finder = new RegExp( `
            ${regex_size_finder.source.replace(string_regex_max_size, "").replace( string_regex_behind_look_parentheses_finder, match => string_regex_max_size + match )}
            -
            .+
        `.replace(/\s+/g, "") )

        const src_with_last_param_fixed = src_with_new_size.replace(regex_last_param_non_quality_finder, "")

        image.src = src_with_last_param_fixed
    }

    /**
     * @param {HTMLImageElement} imageOriginal
     * @param {Number} maxSizePercent
    **/
    const ChangeImageSize = function(image, maxSizePercent)
    {
        const vmin_in_pixel = Math.min(window.innerWidth, window.innerHeight) / 100
        const new_size_in_pixel = vmin_in_pixel * maxSizePercent
        /** @param {String} v */
        const GetSizeInPixels = (v) => v + "px"

        image.style.minWidth = image.style.minHeight = GetSizeInPixels(new_size_in_pixel * 0.6)
        image.style.maxWidth = image.style.maxHeight = GetSizeInPixels(new_size_in_pixel)
    }

//#endregion

//#region "Core Functions"

    /**
     * @param {HTMLImageElement} imageOriginal
     * @param {HTMLImageElement} imagePreview
    **/
    const ShowImageLarger = function(imageOriginal, imagePreview)
    {
        const original_size = imageOriginal.clientWidth
        const max_size = Math.abs( GetDataSizePerCent() )
        const max_quality = Math.abs( GetDataMaxQuality() )

        ChangeImageSrc( imagePreview, imageOriginal.src, max_quality )

        imagePreview.addEventListener( "load", PreviewHasLoad.bind(imagePreview) )

        function PreviewHasLoad()
        {
            this.style.zIndex = "99999"
            this.style.position = "fixed"
            this.style.pointerEvents = `none`

            ChangeImageSize( imagePreview, max_size )

            const bounds_original = imageOriginal.getBoundingClientRect()

            this.style.top = bounds_original.top + "px"
            this.style.left = bounds_original.left + "px"

            const point_x = bounds_original.x + this.width
            const point_y = bounds_original.y + this.height

            let moveX = 0
            , moveY = 0;

            if ( point_x > window.innerWidth )
                moveX = `-${ this.width - original_size }px`

            if ( point_y > window.innerHeight )
                moveY = `-${ ( point_y - window.innerHeight ) * 1.25 }px`

            this.style.transform = `translate(${moveX}, ${moveY})`
        }

        document.body.append( imagePreview )
    }
    /**
     * @param {HTMLImageElement} imageOriginal
     * @param {HTMLImageElement} imagePreview
    **/
    const RemoveLargerImage = function(imageOriginal, imagePreview)
    {
        imagePreview.remove()
    }

//#endregion

//#region "Page Integration"

    /** @param {HTMLImageElement} image */
    const GetMagnifyingHoverEffect = function( image )
    {
        const events_ = (function(){

            let isImageAttached = false;

            const original_src = image.src
            const image_attached = new Image()
            const CancelByKeyboard = function( event = KeyboardEvent.prototype )
            {
                if ( event.repeat )
                    return

                const key_searched = GetDataCancelKey() || __configs.yt_avatar_cancel_key

                const regex_key_group = new RegExp( "[" + key_searched + "]" , "gi" )
                const match_ = event.key.match( event.key.length == 1 ? key_searched : regex_key_group )

                if ( match_ )
                    if ( event.key.length > 1 )
                        if ( match_.length !== key_searched.length )
                            return;

                CancelMagnify( )
                event.preventDefault()
            }

            function FixContextMenuLink()
            {
                if ( !isImageAttached )
                    return;

                this.src = image_attached.src
            }

            function Magnify()
            {
                isImageAttached = true;

                ShowImageLarger( this, image_attached )

                document.addEventListener( "keydown", CancelByKeyboard )
            }

            function CancelMagnify( event = MouseEvent.prototype )
            {
                if ( !isImageAttached )
                    return;

                isImageAttached = false;

                this.src = original_src

                RemoveLargerImage( image, image_attached )

                document.removeEventListener( "keydown", CancelByKeyboard )
            }

            return Object.freeze(
                {
                    FixContextMenuLink: Object.freeze({
                        name: "contextmenu"
                        , event: FixContextMenuLink
                    })
                    , Magnify: Object.freeze({
                        name: "mouseenter"
                        , event: Magnify
                    })
                    , CancelMagnify: Object.freeze({
                        name: "mouseleave"
                        , event: CancelMagnify
                    })
                    , CancelMagnifyByClick: Object.freeze({
                        name: "click"
                        , event: CancelMagnify
                    })
                }
            )

        })()

        return Object.freeze({
            element: image
            ,
            /** @type {IEventListenerManager} */
            eventListenerManager: ( functionName ) => Array.from(Object.values(events_)).forEach( eventObject => image[functionName]( eventObject.name , eventObject.event ) )
        })
    }

    window.addEventListener('urlchange', () => 
    {
        images_with_magnify_effect.forEach( tag => tag.eventListenerManager( "removeEventListener" ) )
        images_with_magnify_effect.length = 0
    })

    document.addEventListener("mouseover",
        (event = MouseEvent.prototype) =>
        {
            /** @type {HTMLElement} */
            const image_ = event.target
            const string_regex_behind_look_for_slash = /(?<=[/])/.source
            const string_regex_forward_look_for_slash = /(?=[/])/.source
            const string_regex_forward_not_look_for_slash = /(?=[^/])/.source
            const regex_is_video_thumb = new RegExp( `
            ${string_regex_behind_look_for_slash}
                an
            ${string_regex_forward_not_look_for_slash}
                |
            ${string_regex_behind_look_for_slash}
                vi
            ${string_regex_forward_look_for_slash}
            `.replace(/\s+/g, "") )

            if ( image_.nodeName !== "IMG" )
                return

            if ( !image_.src )
                return

            if ( image_.src.match(regex_is_video_thumb) )
                return

            if ( images_with_magnify_effect.find( value => value.element === image_) )
                return

            const instance_ = GetMagnifyingHoverEffect( image_ )
            instance_.eventListenerManager( "addEventListener" )

            images_with_magnify_effect.push( instance_ )

        }, {passive: true}
    )

//#endregion

// @collapse