import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() => runApp(MyApp());
// this will wrap the website in a view compatible for mobile applications
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: WebView(
          initialUrl: "",
          javascriptMode: JavascriptMode.unrestricted,
        ),
      ),
    );
  }
}