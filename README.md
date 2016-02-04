# ftui-readingspopup-widget

Widget Theme Dark

![Std_dark](https://github.com/svenson08/ftui-readingspopup-widget/blob/master/screenshots/dark_default.PNG?raw=true "Std_dark")


Widget Theme light

![Std_light](https://github.com/svenson08/ftui-readingspopup-widget/blob/master/screenshots/light_default.PNG?raw=true "Std_light")

Deaktiviertes Device

![Std_Disabled](https://github.com/svenson08/ftui-readingspopup-widget/blob/master/screenshots/light_disabled.PNG?raw=true "Std_Disabled")

Verwendet:
-----------
* JQuery: https://jquery.com/  [in fhem enthalten]
* JQuery-UI: https://jqueryui.com/  [in fhem enthalten]
* Switchery: https://github.com/abpetkov/switchery   [in fhem-tablet-ui enthalten]

Installation
-------------
Die Datei **widget_popupreadings.js** muss in das js Verzeichnis der fhem-tablet-ui installation.
Die Datei **fhem-tablet-ui-popupreadings.css** muss in das css Verzeichnis der fhem-tablet-ui installation.
Anschließend muss die fhem-tablet-ui-popupreadings.css in der genutzten html datei eingefügt werden.
```html
<link rel="stylesheet" href="/fhem/tablet/css/fhem-tablet-ui-popupreadings.css" />
```
Alternativ kann der Inhalt der **fhem-tablet-ui-popupreadings.css** auch in die **fhem-tablet-ui-user.css** kopiert werden.
 
Attribute des Widgets
-----------
####Pflicht-Attribute:
- **data-device** : FHEM Device Name
- **data-readinglist**: Liste der Editierbaren Readings. Dabei muss der Anzeigetext und das Reading angegeben sein. Wenn eine Auswahl statt eines Eingabefeldes erzeugt werden soll müssen mehrere Werte mit einem Kommagetrennt angegeben werden.
```html
    data-readinglist='{"readingTitel":"<Anzeigetext>", "readingName":"<FHEM Reading aus dem Device>", "readingWerte":"<Wert1>,<Wert2>", "readingReadOnly":"true"}, {<Beliebige erweiterbar>}' : Liste der angezeigten Readings.
```

####Optionale-Attribute:
- **data-width** : Breite des Dialogs (Standard '450').
- **data-height** : Höhe des Dialogs (Standard '300').
- **data-title** : Titel des Dialogs. Angabe ALIAS verwendet den Alias des Weekdaytimers.
                                               Angabe NAME verwendet den Namen des Weekdaytimers.
                                               Angabe eines beliebigen Dialog-Titels (Standard 'NAME').
- **data-icon** : Dialog Titel Icon (Standard 'fa-clock-o').
- **data-disablestate** : Deaktiviert die Möglichkeit den weekdaytimer zu deaktivieren/aktivieren
- **data-theme** : Angabe des Themes, möglich ist 'dark', 'light', oder beliebige eigene CSS-Klasse für individuelle Themes.
- **data-style** :Angabe 'round' oder 'square'.
- **data-infotext**: Zeigt über den Readings einen beliebigen (Erklärungs-) Text im Popup an.

Beispiel
-----------
```html       
        <div id="popupreadings"
                data-type="popupreadings" 
                data-device="EVENT_TEST_onIntervall"    
                data-style="square" 
                data-theme="dark" 
                data-title="Heizungssteuerung"  
                data-infotext="Die Angabe der Ein- und Ausschaltaußentemperatur bestimmt das Verhalten der Heizungsthermostate" 
                data-readinglist='[{"readingTitel":"Einschalttemperatur", "readingName":"reading01", "readingValues":"13 Grad", "readingReadOnly":"false"}, {"readingTitel":"Ausschalttemperatur", "readingName":"reading02", "readingValues":"19 Grad", "readingReadOnly":"false"}]'
                >
        <div data-type="label" class="cell">Licht</div>
        </div>             
```        

In diesem Beispiel wird das Popup über 
```html
  <div data-type="label" class="cell">Licht</div>
```
aufgerufen. Es kann aber auch jegliches anderes "Objekt" als Aufruf festgelegt werden.