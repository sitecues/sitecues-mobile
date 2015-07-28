// todo: in the first version of the product we will only support bp, tts and invert contrast which
// afaik don't require internet connection so we might preserve online-offline code until later.

// todo: many functions have 'result' variable that is very generic,
// i would like to give the variables more descriptive names

// todo: many functions are not used anymore, cleanup

// todo: split the code accross features, i.e.: core, badge, text-select, speech, invert-contrast, online-offline

(function () {

    'use strict';

    var sitecues, config, state;

    window.sitecues = window.sitecues || {};
    sitecues = window.sitecues;

    // todo: what about the other protocols?
    config = {
        protocol : 'https:'
    };

    // todo: probably makes sense to have this in init()
    (function () {

        // we will expose these on the state object...
        var initialized = false,
            speechOn = false,
            online = true;

        state = {
            events : [
                {
                    name   : 'speech/toggle',
                    action : toggleSpeech
                }
            ]
        };

        Object.defineProperty(
            state, 'eventNames',
            {
                // configurable: false,
                enumerable : true,
                get : function () {
                    var result = state.events.map(
                        function mapEventToName(event) {
                            return event.name;
                        }
                    );
                    return result;
                },
                set : function (value) {
                    throw new Error('Assigning new values to the eventNames property is not allowed.');
                }
            }
        );

        Object.defineProperty(
            state, 'initialized',
            {
                enumerable : true,
                get : function () {
                    return !!initialized;
                },
                set : function (value) {
                    if (!initialized) {
                        initialized = true;
                    }
                }
            }
        );

        Object.defineProperty(
            state, 'speechOn',
            {
                enumerable : true,
                get : function () {
                    return !!speechOn;
                },
                set : function (value) {
                    speechOn = !!value;
                }
            }
        );

        Object.defineProperty(
            state, 'online',
            {
                enumerable : true,
                get : function () {
                    return !!online;
                },
                set : function (value) {
                    online = !!value;
                }
            }
        );

        Object.defineProperty(
            state, 'voices',
            {
                enumerable : true,
                writable   : true
            }
        );
    })();

    /*
    PUBLIC API
        todo: maybe move it to the top of the file since it's important
        todo: should be documented while design process
     */
    function exportPublicApi() {

        // Public interfaces...

        Object.defineProperties(
            sitecues,
            {
                'initialized' : {
                    // configurable: false,
                    enumerable: true,
                    get: function () {
                        return state.initialized;
                    },
                    set: function (value) {
                        throw new Error('Assigning to sitecues.initialized is not allowed.');
                    }
                },
                'events' : {
                    // configurable: false,
                    enumerable: true,
                    get: function () {
                        return state;
                    },
                    set: function (value) {
                        throw new Error('Assigning to the events property is not allowed.');
                    }
                }
            }
        );
    }

    function whatis(obj) {

        // This function is designed to get more information about an object
        // than typeof or instanceof, etc.

        // Step 1: Grab the purest toString method we can and call it with the
        //         passed-in object used as its internal 'this' reference.
        // Step 2: Take the string, which should look like '[object Whatever]'
        //         and extract only letters after the first space.
        // Step 3: Take the string, which should now be the object's true type
        //         and make it lower case, to normalize everything.

        return Object.prototype.toString.call(obj).match(/\s([A-Za-z]+)/)[1].toLowerCase();
    }

    function isNative(context) {

        // This function is designed to check whether a function is native,
        // which is useful for situations when you want to ensure that an
        // API like console.log has not been overwritten.

        var contextType = typeof context, matches, result;

        // Only care about functions...
        if (contextType === 'function') {
            // Grab the purest toString method we can, and call it with the desired
            // context used as its internal 'this' reference. The regex takes into
            // account browser quirks which output the string differently.
            matches = Function.prototype.toString.call(context).match(/^\s*?function(?:\s+?.*?|\s*?)\(.*?\)\s*?\{\s*?\[native\s*?code\]/i);
            if (matches && matches.length === 1) {
                result = true;
            }
            else {
                result = false;
            }
        }

        return result;
    }

    function isTheGlobalObject(obj) {

        return whatis(obj) === 'global';
    }

    function isSpeechSynthesisUtterace(obj) {

        return whatis(obj) === 'speechsynthesisutterance';
    }

    function isPlainObject(obj) {

        return whatis(obj) === 'object';
    }

    function isNull(obj) {

        return whatis(obj) === 'null';
    }

    function isRegExp(obj) {

        return whatis(obj) === 'regexp';
    }

    function isDate(obj) {

        return whatis(obj) === 'date';
    }

    function isMath(obj) {

        return whatis(obj) === 'math';
    }

    function isArray(obj) {

        return whatis(obj) === 'array';
    }

    function isArrayish(obj) {

        var objType = typeof obj, result;

        if (obj && typeof obj.length === 'number' && objType !== 'string' && objType !== 'function') {
            result = true;
        }
        else {
            result = false;
        }

        return result;
    }

    function toArray(data) {

        var result = [];

        if (arguments.length > 0) {
            if (data && data.length) {
                result = Array.prototype.slice.call(data);
            }
            else {
                result = [data];
            }
        }

        return result;
    }

    /*
     This function is designed to deep copy all arguments into
     a new, single-level array. It remains generic by only
     */
    function flatten() {

        var queue = Array.prototype.slice.call(arguments),  // convert arguments to a true array and initialize the queue
            item, i, result = [];

        // if the queue is not empty, keep going...
        while (queue.length > 0) {
            item = queue.shift();  // get and remove the first value from the queue
            // detect arrays and treat them special...
            if (item && typeof (i = item.length) === 'number' && typeof item !== 'string' && typeof item !== 'function') {
                // now we do a reverse loop if the array is non-empty...
                while (i--) {
                    // add the array's children to the beginning of the queue
                    // to keep their order intact...
                    queue.unshift(item[i]);
                }
            }
            // the current item has no depth we wish to traverse, so add it to the result list...
            else {
                result.push(item);
            }
        }

        return result;
    }

    function getTheGlobalObject() {

        var result;

        // NOTE: The typeof checks here are solely to avoid ReferenceError(s) being thrown...
        if (typeof this === 'object' && isTheGlobalObject(this)) {
            result = this;
        }
        else if (typeof window === 'object' && isTheGlobalObject(window)) {
            result = window;
        }
        else if (typeof global === 'object' && isTheGlobalObject(global)) {
            result = global;
        }

        return result;
    }

    // namespace('foo') // returns window.foo or {}.foo
    // namespace(myObj, 'hello.foo') // returns myObj.hello.foo
    // todo: the idea of namespaces is great but i don't see the need to complicate the code here
    function namespace() {

        var defaultBase  = getTheGlobalObject() || {},
            defaultForce = false,
            args         = flatten(arguments),
            argsLen      = args.length,
            firstArg     = args[0],
            lastArg      = args[argsLen - 1],
            base         = (typeof firstArg === 'object' && firstArg) ? firstArg : defaultBase,
            force        = typeof lastArg === 'boolean' ? lastArg : defaultForce,
            separator    = '.',  // the semantic fencepost for namespaces
            findSeparators = new RegExp('\\' + separator + '+', 'gi'),  // match all chains of at least one escaped seperator
            filtered     = args.filter(isUsableNamespace),
            parts        = filtered.join(separator).replace(findSeparators, separator).split(separator),
            i, len = parts.length, result = base;

        function isUsableNamespace(item) {
            // filter which returns true if an argument is eligible to be used as a namespace
            // keep in mind its .toString() will be called when setting it as a property
            return typeof item === 'string' || typeof item === 'number';
        }
        // the act of joining and then splitting an array will never result in an empty array,
        // even if the original was empty, so we need to check that we have not accidentally
        // inserted data for us to loop over...
        if (len > 0 && filtered.length > 0) {
            for (i = 0; i < len; i = i + 1) {
                if (Object.prototype.hasOwnProperty.call(base, parts[i]) && base[parts[i]]) {
                    base = base[parts[i]];
                }
                else if (force) {
                    base = base[parts[i]] = {};
                }
                else {
                    break;
                }
            }
            //result = base;
        }

        return result;
    }

    // TODO: Make a utility function to translate between x, width, innerWidth, left, right, etc.

    function getViewport() {

        var result;

        result = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        return result;
    }

    function getViewportPercent(data, direction, includeUnit) {

        var result;

        // This function is designed to convert pixel measurements
        // into a percentage of the current viewport.

        var dataType = typeof data,
            dataString,
            dataFloat = parseFloat(data),
            dataFloatString,
            dataUnit,
            includeUnit = (typeof unit === 'boolean') ? unit : false;

        if (typeof includeUnit === 'undefined') {
            includeUnit = true;
        }

        // TODO: Map things like 'x' or 'y' to the appropriate API
        direction = 'innerWidth';

        if (!Number.isNaN(dataFloat)) {
            dataFloatString = dataFloat.toString();
            dataUnit = dataString.substring(dataFlaotString.length);
        }



        result = data / (window[direction] * 0.01);

        return result;
    }

    function speechIsSupported(context) {

        var apis = [
                'speechSynthesis',          // API to play, pause, and cancel speech snippets
                'SpeechSynthesisUtterance'  // API to instantiate a new snippet of speech
            ],
            result;

        context = context || window;

        result = apis.every(isSupported);

        function isSupported(api) {
            return !!context[api];
        }

        return result;
    }

    function stopSpeech() {
        console.log('Stopping speech!');
        speechSynthesis.cancel();
    }

    function toggleSpeech(cue) {
        // speak a cue if provided, regardless of the current state...
        if (cue) {
            forceSpeak(cue);
        }
        // reverse the current polarity...
        return state.speechOn = !state.speechOn;
    }

    function toggleSpeechWithCue() {

        // TODO: this should probably be the default behavior of toggleSpeech
        //       and there should be a toggleSpeechSilently() helper

        // say the opposite of the current state...
        return toggleSpeech('Speech ' + (state.speechOn ? 'off' : 'on') + ' .');
    }

    // get selected text, if any...
    function getSelectedText() {

        var result = "";

        // WebKit and Gecko...
        if (typeof window.getSelection !== "undefined") {
            result = window.getSelection().toString();
        }
        // Internet Explorer...
        else if (typeof document.selection !== "undefined" && document.selection.type === "Text") {
            result = document.selection.createRange().text;
        }

        return result;
    }

    // todo: the name is misleading b/c it returnes all the voices, not only the best one
    function getBestVoice(voices) {

        var result = 0;

        if (typeof voices === 'undefined') {
            voices = window.speechSynthesis.getVoices();
        }

        return result;
    }

    // speak text to the user...
    // todo: using native browser APIs
    function speak(text, voice, polite, force) {

        var speechApi = window.speechSynthesis,
            voiceType = typeof voice,
            voices,
            bestVoice,
            speech;

        if (speechApi && text && (state.speechOn || force)) {
            // by default, we are rude and interrupt...
            if (!polite) {
                console.log('Speaking rudely.');
                stopSpeech();  // stop all speech immediately
            }
            voices          = speechApi.getVoices();
            bestVoice       = voiceType === 'number' ? voices[voice] : ((voice && voiceType === 'object') ? voice : voices[getBestVoice()]);
            speech          = new SpeechSynthesisUtterance();
            speech.voice    = bestVoice;  // Note: some voices don't support altering their settings
            console.log('Speaking with:', bestVoice.name);
            // todo: add support for multi-lang
            speech.lang     = 'en-US';
            // speech.voiceURI = 'native';
            speech.volume   = 1;  // float from 0 to 1, default is 1
            speech.rate     = 1;  // float from 0 to 10, default is 1
            speech.pitch    = 1;  // float from 0 to 2, default is 1
            speech.text     = text;  // the text to be spoken

            // Event listeners...

            // speech.addEventListener('start', function onSpeechStart(event) {
            //     console.log('Began speech.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });
            // speech.addEventListener('end', function onSpeechEnd(event) {
            //     console.log('Finished in ' + event.elapsedTime + ' seconds.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });
            // speech.addEventListener('error', function onSpeechError(event) {
            //     console.log('Speech error.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });
            // speech.addEventListener('pause', function onSpeechPause(event) {
            //     console.log('Speech was paused.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });
            // speech.addEventListener('resume', function onSpeechResume(event) {
            //     console.log('Speech has resumed from a paused state.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });
            // speech.addEventListener('boundary', function onSpeechBoundary(event) {
            //     console.log('Encountered a word or sentence boundary.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });
            // speech.addEventListener('mark', function onSpeechMark(event) {
            //     console.log('Encountered an SSML mark tag.');
            //     console.log(Object.getOwnPropertyNames(event));
            // });

            speechApi.speak(speech);
        }
    }

    // todo: what's the difference between polite and force speak?
    function politeSpeak(text, voice) {
        speak(text, voice, true);
    }

    function forceSpeak(text, voice) {
        speak(text, voice, undefined, true);
    }

    function forcePoliteSpeak(text, voice) {
        speak(text, voice, true, true);
    }

    function speakSelectedText() {
        var selectedText = getSelectedText();
        if (selectedText) {
            console.log('Detected mouse up and selected text, about to speak:', selectedText);
            speak(selectedText);
        }
        else {
            console.log('Detected mouse up, but no selected text.');
        }
        // return selectedText;
    }

    function getBadgeWrapper() {

        // This function is designed to return a wrapper element to contain
        // our badge image and its sibling used for effects.

        var elem = document.createElement('div'),
            result = elem;

        // TODO Finish this up...

        elem.id = 'sitecues-badge';
        elem.className = 'sitecues sitecues-badge';
        elem.style.display = 'none';
        elem.style.visibility = 'hidden';
        elem.style.opacity = '0';
        elem.style.position = 'fixed';
        elem.style.zIndex = '2147483645';  // we will sit 2 levels below uppermost layer
        elem.style.bottom = '200px';
        elem.style.right = '300px';
        // elem.style.top = '70vh';
        // elem.style.left = '70vw';
        // elem.style.right = '30vw';
        // elem.style.bottom = '30vh';
        // if you want to change the badge dimensions, this is the place to do so...
        elem.style.height = '15vw';
        elem.style.width = '15vw';
        elem.style.transition = 'opacity 1s linear';
        elem.src = config.protocol + '//googledrive.com/host/0B18rz_WzoeJQeUZfVW9uOVoxT0U/sitecues-icon-extra-padded-x500.png';
        elem.draggable = false;  // we handle dragging ourselves with event listeners

        return result;
    }

    function getBadgePillow() {

        // This function is designed to return an element that will be a sibling to our
        // badge image, but visually sit behind it, to act as an enhanced background.
        // This is done because CSS blur filters cannot be applied only to backgrounds
        // without affecting the foreground or child content, and we do not want to blur
        // our badge image, but we do want a cloud effect to separate it from the page.

        var elem = document.createElement('div'),
            result = elem;

        elem.id = 'sitecues-badge-pillow';
        elem.className = 'sitecues sitecues-badge';
        elem.style.position = 'absolute';  // take out of flow so we can sit under the badge image
        elem.style.zIndex = '2147483646';  // we will sit 1 level below uppermost layer
        elem.style.borderRadius = '50%';  // make a perfect circle to mimic the badge image shape
        elem.style.background = 'rgba(255, 255, 255, 0.5)';  // white with some transparency
        elem.style.width = '100%';
        elem.style.height = '100%';
        elem.style.filter = 'blur(10px)';  // provide the luminous effect
        elem.style.OFilter = 'blur(10px)';
        elem.style.MsFilter = 'blur(10px)';
        elem.style.MozFilter = 'blur(10px)';
        elem.style.WebkitFilter = 'blur(10px)';
        elem.draggable = false;  // we handle dragging ourselves with event listeners

        return result;
    }

    // todo: maybe prepare a placeholder image that is available from native?
    function getBadgeImage() {

        // This function is designed to return an image element, which will be a child of the
        // overall sitecues badge structure.

        var elem = document.createElement('img'),
            result = elem;

        elem.id = 'sitecues-badge-image';
        elem.className = 'sitecues sitecues-badge';
        elem.style.position = 'relative';
        elem.style.zIndex = '2147483647';  // we will sit at the uppermost layer
        elem.style.width = '100%';
        elem.style.height = '100%';  // TODO: check actual image aspect ratio and ensure we don't stretch!
        elem.src = config.protocol + '//googledrive.com/host/0B18rz_WzoeJQeUZfVW9uOVoxT0U/sitecues-icon-extra-padded-x500.png';
        elem.draggable = false;  // we handle dragging ourselves with event listeners

        return result;
    }


    // todo: this function has a side effect(append) that should be taken out to a separate function
    function getBadgeElement() {

        var wrapper = getBadgeWrapper(),  // top of the structure
            pillow  = getBadgePillow(),   // fancy background effect
            image   = getBadgeImage(),    // sitecues symbol
            result  = wrapper;

        wrapper.appendChild(pillow);
        wrapper.appendChild(image);

        return result;
    }

    function addTouchSupport(badge) {

        // Do the necessary work to make the badge draggable...

        // TODO: figure out how to prevent edges of the badge from crossing the viewport's boundaries

        var currentMousePosition = {
            'x': undefined,
            'y': undefined
        };

        console.log('Badge element:', badge);

        function moveBadge(event) {
            console.log('Moved badge:', event);

            // todo: if top and/or left are undefined then set '0'
            badge.style.top = (parseFloat(getComputedStyle(badge).top) + event.clientY - currentMousePosition.y) + 'px';
            badge.style.left = (parseFloat(getComputedStyle(badge).left) + event.clientX - currentMousePosition.x) + 'px';

            console.log('Move by: ', {
                'x': event.clientX - currentMousePosition.x,
                'y': event.clientY - currentMousePosition.y
            });

            currentMousePosition.x = event.clientX;
            currentMousePosition.y = event.clientY;

        }

        function onMouseUp(event) {
            window.removeEventListener('mousemove', moveBadge, true);
        }

        function onMouseDown(event){
            window.addEventListener('mousemove', moveBadge, true);
            currentMousePosition.x = event.clientX;
            currentMousePosition.y = event.clientY;
        }

        function addListeners(){
            badge.addEventListener('mousedown', onMouseDown, false);
            window.addEventListener('mouseup', onMouseUp, false);
        }

        addListeners();
    }

    function attachBadge(badge, anchor) {

        if (!badge || typeof badge !== 'object') {
            badge = getBadgeElement();
        }
        if (!anchor || typeof anchor !== 'object') {
            anchor = document.querySelector('body');
        }

        anchor.appendChild(badge);

        return badge;
    }

    function showBadge(elem) {

        var elemType = typeof elem;

        if (!elem) {
            elem = attachBadge(getBadgeElement());
        }
        else if (elemType === 'object' && elem.length > 0) {
            elem = elem[0];  // assume it's a collection, with the first element being our target
        }
        else if (elemType === 'string') {
            elem = document.querySelector(elem);
        }

        if (elem) {
            elem.style.display = 'block';
            elem.style.visibility = 'visible';
            setTimeout(
                function (elem) {
                    elem.style.opacity = '1';
                },
                0,  // delay
                elem  // argument for callback
            )
        }

        return elem;
    }

    /**
     * Prepare and show sitecues badge and other UI elements.
     * @returns {*}
     */
    function showUserInterface() {

        var badge = getBadgeElement(),
            result = badge;

        console.log('sitecues message: Showing interface.');

        // todo: this functionality is not showing the badge, take it out to a separate method.
        badge.addEventListener('click', onBadgeClick);
        addTouchSupport(badge);
        attachBadge(badge);
        showBadge(badge);

        // todo: return 'undefined' if there is no element is ready to use.
        return result;
    }

    // Event handlers...

    function onBadgeClick(event) {
        toggleSpeechWithCue();
    }

    function onUnload(event) {
        // local speech synthesis behaves as a buffered queue of audio snippets
        // and continues to play across page loads, which users may not expect,
        // so let's stop that from happening...
        stopSpeech();
        // forceSpeak('Navigating to new page.');
    }

    function onKeyUp(event) {
        // Users need a way to interrupt and stop speech at any time,
        // which we provide via pressing any key.

        // TODO: Thought experiment: what should typing in a text field do?

        // todo: make sure the key code are valid for all the supported browsers & different platforms

        // if the key is 's' (as in speech)...
        if (event.keyCode === 83) {
            toggleSpeechWithCue();
        }
        // if the key is the spacebar...
        else if (event.keyCode === 32) {
            speakSelectedText();
        }
    }

    // todo: why do we care about 'voicechanged' event?
    function onFirstVoicesChanged(event) {
        console.log('First voice loaded.', event);
        forceSpeak('sightcues is ready.');
        // listen for events that indicate there may be a text selection so we can speak them...
        document.addEventListener("mouseup", speakSelectedText);

        // remove thyself...
        event.target.removeEventListener(event.type, onFirstVoicesChanged, false);
    }

    function onVoicesChanged(event) {
        console.log('New voices have been loaded!');
        console.log('Event:', event);
        // window.speechSynthesis.getVoices();
        // TODO log which voices are different than the current set
        // TODO prune and push to state.voices with updated list
    }

    function onFirstOffline(event) {

        // This event handler determines behavior when our application detects
        // the first instance of losing internet.

        forceSpeak('Internet connectivity has been lost.');
        // remove thyself...
        event.target.removeEventListener(event.type, onFirstOffline, false);
    }

    function onOffline(event) {

        // This event handler determines behavior when our application detects
        // a loss of internet connectivity.

        // first, keep track of state in case other modules are ignorant...
        state.online = false;
        // generate speech locally, etc...
        // useLocalAudio();
    }

    function onFirstOnline(event) {

        // This event handler determines behavior when our application detects
        // the first instance of re-connecting to the internet.

        forceSpeak('Internet connectivity re-established.');
        // remove thyself...
        event.target.removeEventListener(event.type, onFirstOnline, false);
    }

    function onOnline(event) {

        // This event handler determines behavior when our application detects
        // a loss of internet connectivity.

        // first, keep track of state in case other modules are ignorant...
        state.online = true;
        // re-configure so speech can be used from our servers if desired...
        // useNetworkAudioIfWanted();
    }

    // do everything we need to start running our application...
    function init() {

        // todo: no need to initialize the constants here,
        // we can take those out to a higher level of scopes

        var okReadyStates = [  // we may initialize based on these document states
                'interactive', // DOM is ready, page is usable, like addEventListener('DOMContentLoaded' ...)
                'loaded',
                'complete'  // images are ready, like addEventListener('load' ...)
            ],
            okLoadEvent = 'DOMContentLoaded',  // we may initialize based on this event
            readyState  = document.readyState,  // actual ready state at run time
            isReady     = okReadyStates.indexOf(readyState) >= 0;

        if (isReady) {
            console.log('sitecues message: readyState \"' + readyState + '\" was acceptable for init.');
            start();
        }
        else {
            console.log('sitecues message: adding event listener for init.');
            // TODO: Make the callback remove its own listener
            document.addEventListener(okLoadEvent, start, false);
        }

        function start(event) {
            if (!state.initialized) {

                showUserInterface();

                // TODO: Verify this is right...
                window.addEventListener('offline', onFirstOffline, false);
                window.addEventListener('offline', onOffline, false);
                window.addEventListener('online', onFirstOnline, false);
                window.addEventListener('online', onOnline, false);

                window.addEventListener('keyup', onKeyUp, false);

                if (speechIsSupported()) {
                    // speech synthesis is supported, we are good to go!

                    // local speech synthesis keeps playing after page navigation,
                    // so we may want to stop that from happening...
                    window.addEventListener('unload', onUnload);

                    // TODO: get this working in Safari, which is synchronous and does not support addEventListener

                    // wait on voices to be loaded before doing anything else...
                    window.speechSynthesis.addEventListener('voiceschanged', onFirstVoicesChanged);
                    // prune and populate new voices as the system is updated...
                    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
                }
                else {
                    // Ah man, speech synthesis is not supported, tell the user if needed.
                    console.warn('sitecues warning: native speech synthesis is unsupported on this platform');
                }
            }
            else {
                console.warn('sitecues message: tried to initialize more than once!');
            }

            // check if we were called as an event handler...
            if (event && typeof event === 'object') {
                console.log('Load event:', event);
                console.log('sitecues message: removing our start event listener.');

                // remove thyself...
                event.target.removeEventListener(event.type, start, false);
            }

            state.initialized = true;
            exportPublicApi();
        }
    }

    function exit() {

        // Here we should hide, remove, delete, and cleanup anything we can to shut ourselves down.

        stopSpeech();

    }

    // Start point
    init();

}());
