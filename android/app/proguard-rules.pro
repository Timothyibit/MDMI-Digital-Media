# Keep Capacitor plugin bridges and webview interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep Codetrix Google Auth plugin
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }

# Keep Firebase messaging & notifications
-keep class com.google.firebase.** { *; }
-keep class com.capacitorjs.plugins.** { *; }

# Ignore warnings for optional/unreferenced transitive classes (e.g. Kotlin KTX extensions)
-dontwarn com.google.firebase.**
-dontwarn com.capacitorjs.**
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

# Preserve line numbers and source files for clean Play Console stack traces
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
-printmapping mapping.txt
