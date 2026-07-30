package ai.biassense.app

import android.os.Bundle
import android.provider.OpenableColumns
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import ai.biassense.app.data.FirebaseSyncRepository
import ai.biassense.app.data.SyncState
import ai.biassense.app.domain.AnalysisRecord
import ai.biassense.app.domain.MetricExtractor
import ai.biassense.app.domain.UserProfile
import com.google.firebase.auth.FirebaseAuth

private val Navy = Color(0xFF050914)
private val Card = Color(0xFF10192C)
private val Border = Color(0xFF22314F)
private val Teal = Color(0xFF08D0AD)
private val Muted = Color(0xFF929BAF)
private val Cobalt = Color(0xFF275BE7)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState); enableEdgeToEdge()
        setContent { BiasTheme { BiasSenseApp() } }
    }
}

@Composable private fun BiasTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = darkColorScheme(primary=Teal, secondary=Cobalt, background=Navy, surface=Card,
        onBackground=Color.White, onSurface=Color.White, outline=Border), content=content)
}

@Composable fun BiasSenseApp() {
    val nav = rememberNavController()
    val start = if (FirebaseAuth.getInstance().currentUser == null) "onboarding" else "shell"
    NavHost(nav, startDestination = start) {
        composable("onboarding") { Onboarding { nav.navigate("auth") } }
        composable("auth") { AuthScreen { nav.navigate("shell") { popUpTo("auth"){inclusive=true} } } }
        composable("shell") { AppShell { nav.navigate("auth") { popUpTo("shell"){inclusive=true} } } }
    }
}

@Composable private fun Onboarding(next: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Navy).systemBarsPadding().padding(28.dp),
        horizontalAlignment=Alignment.CenterHorizontally, verticalArrangement=Arrangement.SpaceBetween) {
        Spacer(Modifier.height(12.dp))
        Column(horizontalAlignment=Alignment.CenterHorizontally) {
            DnaArt()
            Text("BiasSense AI", fontSize=34.sp, fontWeight=FontWeight.Bold)
            Text("Detect. Analyze. Improve.", color=Teal, letterSpacing=2.sp)
        }
        MedicalCard(Modifier.fillMaxWidth()) {
            Icon(Icons.Outlined.DocumentScanner,null,tint=Teal,modifier=Modifier.size(48.dp))
            Text("Select Lab Data",fontSize=22.sp,fontWeight=FontWeight.Bold)
            Text("Drop or browse CSV, Excel, or PDF control sheets from local diagnostics software.",
                color=Muted, lineHeight=22.sp)
        }
        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){ repeat(3){ Box(Modifier.size(if(it==0) 22.dp else 8.dp,8.dp).background(if(it==0) Teal else Border, RoundedCornerShape(8.dp))) } }
        Button(next,Modifier.fillMaxWidth().height(56.dp),shape=RoundedCornerShape(18.dp)){ Text("Get Started") }
    }
}

@Composable private fun DnaArt() {
    Canvas(Modifier.fillMaxWidth().height(210.dp)) {
        for(i in 0..10){ val y=20f+i*16f; val x1=size.width*.35f+kotlin.math.sin(i*.8).toFloat()*55
            val x2=size.width*.65f-kotlin.math.sin(i*.8).toFloat()*55
            drawLine(Teal.copy(.55f),Offset(x1,y),Offset(x2,y),5f,StrokeCap.Round)
            drawCircle(if(i%2==0) Teal else Cobalt,8f,Offset(x1,y)); drawCircle(if(i%2==0) Cobalt else Teal,8f,Offset(x2,y)) }
    }
}

@Composable private fun AuthScreen(done: () -> Unit) {
    var register by remember { mutableStateOf(false) }; var name by remember{mutableStateOf("")}
    var email by remember{mutableStateOf("")}; var password by remember{mutableStateOf("")}
    var error by remember{mutableStateOf("")}; var busy by remember{mutableStateOf(false)}
    LazyColumn(Modifier.fillMaxSize().systemBarsPadding().padding(28.dp),verticalArrangement=Arrangement.Center) {
        item {
            Icon(Icons.Outlined.Biotech,null,tint=Teal,modifier=Modifier.size(55.dp))
            Text("BiasSense AI",fontSize=30.sp,fontWeight=FontWeight.Bold)
            Text(if(register)"Create your secure account" else "Sign in to scan documents and manage saved analyses.",color=Muted)
            Spacer(Modifier.height(28.dp))
            if(register) OutlinedTextField(name,{name=it},label={Text("Full name")},modifier=Modifier.fillMaxWidth())
            OutlinedTextField(email,{email=it},label={Text("Email")},modifier=Modifier.fillMaxWidth())
            OutlinedTextField(password,{password=it},label={Text("Password")},visualTransformation=PasswordVisualTransformation(),modifier=Modifier.fillMaxWidth())
            if(error.isNotBlank()) Text(error,color=MaterialTheme.colorScheme.error,modifier=Modifier.padding(vertical=8.dp))
            TextButton({ runCatching { FirebaseAuth.getInstance().sendPasswordResetEmail(email) }.onFailure{error="Enter a valid email first."} }){Text("Forgot password?")}
            Button(onClick={
                if(email.isBlank()||password.length<8||(register&&name.isBlank())){error="Enter valid account details and an 8-character password.";return@Button}
                busy=true; val auth=FirebaseAuth.getInstance()
                val task=if(register)auth.createUserWithEmailAndPassword(email,password) else auth.signInWithEmailAndPassword(email,password)
                task.addOnSuccessListener{credential->
                    busy=false
                    if(register) FirebaseSyncRepository(credential.user.uid).saveProfile(
                        UserProfile(fullName=name,email=credential.user.email?:"")
                    ){ done() } else done()
                }.addOnFailureListener{busy=false;error=it.localizedMessage?:"Authentication failed."}
            },Modifier.fillMaxWidth().height(54.dp),enabled=!busy){if(busy)CircularProgressIndicator(Modifier.size(22.dp))else Text(if(register)"Create account" else "Sign in")}
            TextButton({register=!register;error=""},Modifier.fillMaxWidth()){Text(if(register)"Already registered? Sign in" else "New here? Create account")}
        }
    }
}

private data class Tab(val route:String,val label:String,val icon: androidx.compose.ui.graphics.vector.ImageVector)
private val tabs=listOf(Tab("home","Home",Icons.Outlined.Home),Tab("analyze","Analyze",Icons.Outlined.CloudUpload),
    Tab("insights","Insights",Icons.Outlined.Leaderboard),Tab("reports","Reports",Icons.Outlined.Assessment),Tab("profile","Profile",Icons.Outlined.Person))

@Composable private fun AppShell(signedOut:()->Unit) {
    val nav=rememberNavController(); val current by nav.currentBackStackEntryAsState()
    val uid=FirebaseAuth.getInstance().currentUser?.uid
    val repository=remember(uid){uid?.let(::FirebaseSyncRepository)}
    var sync by remember{mutableStateOf(SyncState())}
    DisposableEffect(repository){repository?.listen{sync=it};onDispose{repository?.stop()}}
    Scaffold(containerColor=Navy,bottomBar={
        NavigationBar(containerColor=Color(0xFF060B17)){
            tabs.forEach{tab->val active=current?.destination?.route==tab.route
                NavigationBarItem(active,{nav.navigate(tab.route){popUpTo(nav.graph.findStartDestination().id);launchSingleTop=true}},
                    {Column(horizontalAlignment=Alignment.CenterHorizontally){Icon(tab.icon,tab.label);if(active)Box(Modifier.padding(top=4.dp).size(4.dp).background(Teal,RoundedCornerShape(5.dp))) }},label=null,
                    colors=NavigationBarItemDefaults.colors(selectedIconColor=Teal,unselectedIconColor=Muted,indicatorColor=Color.Transparent))}}
    }){pad->NavHost(nav,"home",Modifier.padding(pad)){
        composable("home"){HomeScreen(sync){nav.navigate("analyze")}}
        composable("analyze"){AnalyzeScreen(repository)}
        composable("insights"){InsightsScreen(sync.analyses)}
        composable("reports"){ReportsScreen(sync.analyses)}
        composable("profile"){ProfileScreen(sync.profile,repository){FirebaseAuth.getInstance().signOut();signedOut()}}
    }}
}

@Composable private fun ScreenTitle(title:String,sub:String){Column{Text(title,fontSize=32.sp,fontWeight=FontWeight.Bold);Text(sub,color=Muted,fontSize=16.sp)}}
@Composable private fun MedicalCard(modifier:Modifier=Modifier,content:@Composable ColumnScope.()->Unit){Column(modifier.background(Card,RoundedCornerShape(22.dp)).padding(22.dp),verticalArrangement=Arrangement.spacedBy(12.dp),content=content)}

@Composable private fun HomeScreen(sync:SyncState,analyze:()->Unit){
    val records=sync.analyses
    Box(Modifier.fillMaxSize()){LazyColumn(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.spacedBy(18.dp)){
        item{ScreenTitle(if(sync.profile.fullName.isBlank())"Welcome" else "Welcome, ${sync.profile.fullName.substringBefore(" ")}","Your synchronized laboratory analyses")}
        if(sync.error.isNotBlank())item{Text(sync.error,color=MaterialTheme.colorScheme.error)}
        item{Row(horizontalArrangement=Arrangement.spacedBy(12.dp)){Stat("Analyses",records.size.toString(),Modifier.weight(1f));Stat("Completed",records.count{it.status=="Completed"}.toString(),Modifier.weight(1f))}}
        item{Text("Recent analyses",fontSize=22.sp,fontWeight=FontWeight.Bold)}
        if(sync.loading)item{MedicalCard(Modifier.fillMaxWidth()){CircularProgressIndicator();Text("Loading Firebase data…",color=Muted)}}
        else if(records.isEmpty())item{MedicalCard(Modifier.fillMaxWidth()){Icon(Icons.Outlined.Science,null,tint=Teal);Text("No saved analyses yet. Data from the web app will appear here.",color=Muted)}}
        else items(records.take(4),key={it.id}){AnalysisCard(it)}
    };FloatingActionButton(analyze,Modifier.align(Alignment.BottomEnd).padding(24.dp),containerColor=Teal,contentColor=Navy){Icon(Icons.Outlined.Add,null)}}
}
@Composable private fun Stat(label:String,value:String,modifier:Modifier){MedicalCard(modifier.height(135.dp)){Text(label,color=Muted);Text(value,color=Teal,fontSize=38.sp)}}

@Composable private fun AnalyzeScreen(repository:FirebaseSyncRepository?){
    val context=androidx.compose.ui.platform.LocalContext.current
    var chosen by remember{mutableStateOf<android.net.Uri?>(null)}
    var fileName by remember{mutableStateOf("")}
    var status by remember{mutableStateOf("")}
    var busy by remember{mutableStateOf(false)}
    val picker=androidx.activity.compose.rememberLauncherForActivityResult(androidx.activity.result.contract.ActivityResultContracts.OpenDocument()){uri->
        chosen=uri
        fileName=uri?.let{
            context.contentResolver.query(it,arrayOf(OpenableColumns.DISPLAY_NAME),null,null,null)?.use{cursor->
                if(cursor.moveToFirst())cursor.getString(0) else null
            }
        }?:""
        status=""
    }
    LazyColumn(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.spacedBy(24.dp)){
        item{Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.Center){ScreenTitle("Bias Lab","AI laboratory document analysis")}}
        item{MedicalCard(Modifier.fillMaxWidth()){Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.Center){Column(horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(18.dp)){
            Icon(Icons.Outlined.Description,null,tint=Cobalt,modifier=Modifier.size(58.dp));Text("Select a lab report or health document",fontSize=21.sp,fontWeight=FontWeight.Bold)
            Text("PDF, image, TXT, CSV, XLS, XLSX, DOC, or DOCX — maximum 25 MB",color=Muted)
            Button({picker.launch(arrayOf("*/*"))},colors=ButtonDefaults.buttonColors(containerColor=Cobalt)){Text(if(chosen!=null)"Choose another file" else "Browse Files")}
        }}}}
        if(fileName.isNotBlank())item{Text(fileName,color=Teal)}
        if(status.isNotBlank())item{Text(status,color=if(status.startsWith("Saved"))Teal else MaterialTheme.colorScheme.error)}
        item{Button({
            val uri=chosen?:return@Button
            if(repository==null)return@Button
            busy=true;status="Analyzing locally…"
            val extension=fileName.substringAfterLast('.', "").lowercase()
            val text=if(extension=="txt"||extension=="csv")runCatching{
                context.contentResolver.openInputStream(uri)?.bufferedReader()?.use{it.readText()}
            }.getOrNull().orEmpty() else ""
            val metrics=if(text.isBlank())emptyList() else MetricExtractor.extract(text)
            val reportType=when{
                metrics.any{it.attribute.contains("LDL",true)||it.attribute.contains("HDL",true)}->"Lipid Profile"
                metrics.any{it.attribute.contains("creatinine",true)||it.attribute.contains("eGFR",true)}->"Kidney Function Report"
                else->"Laboratory Analysis"
            }
            val findings=metrics.filter{it.classification=="Anomaly"}.map{"${it.attribute} is classified as Anomaly by the local numeric rule."}
            repository.saveAnalysis(AnalysisRecord(
                fileName=fileName,reportType=reportType,metrics=metrics,findings=findings,
                recommendations=listOf("Discuss results with a qualified healthcare professional."),
                summary=if(metrics.isEmpty())"Document synchronized. Structured metrics were not available for this file type." else "Local analysis extracted ${metrics.size} metrics."
            )){result->busy=false;status=if(result.isSuccess)"Saved and synchronized with the web app." else result.exceptionOrNull()?.localizedMessage?:"Save failed."}
        },Modifier.fillMaxWidth().height(54.dp),enabled=chosen!=null&&!busy){Text(if(busy)"Saving…" else "Analyze Document")}}
        item{Text("Only the filename and structured analysis are synchronized. File paths, bytes, and raw document text are not uploaded.",color=Muted)}
    }
}
@Composable private fun EmptyScreen(title:String,sub:String,empty:String){LazyColumn(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.spacedBy(28.dp)){item{ScreenTitle(title,sub)};item{MedicalCard(Modifier.fillMaxWidth()){Icon(Icons.Outlined.QueryStats,null,tint=Teal);Text(empty,color=Muted)}}}}

@Composable private fun ProfileScreen(profile:UserProfile,repository:FirebaseSyncRepository?,signedOut:()->Unit){
    var name by remember{mutableStateOf("")};var role by remember{mutableStateOf("")};var org by remember{mutableStateOf("")};var country by remember{mutableStateOf("")};var alerts by remember{mutableStateOf(false)}
    var status by remember{mutableStateOf("")}
    LaunchedEffect(profile){name=profile.fullName;role=profile.role;org=profile.organization;country=profile.country;alerts=profile.emailAlerts}
    LazyColumn(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){
        item{ScreenTitle("Profile & Settings",FirebaseAuth.getInstance().currentUser?.email?:"")}
        item{OutlinedTextField(name,{name=it},label={Text("Full name")},modifier=Modifier.fillMaxWidth());OutlinedTextField(role,{role=it},label={Text("Role")},modifier=Modifier.fillMaxWidth());OutlinedTextField(org,{org=it},label={Text("Clinical organization")},modifier=Modifier.fillMaxWidth());OutlinedTextField(country,{country=it},label={Text("Country")},modifier=Modifier.fillMaxWidth())}
        item{MedicalCard(Modifier.fillMaxWidth()){Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("Email alerts",fontWeight=FontWeight.Bold);Text("Store your notification preference with your account.",color=Muted)};Switch(alerts,{alerts=it})}}}
        if(status.isNotBlank())item{Text(status,color=Teal)}
        item{Button({
            val email=FirebaseAuth.getInstance().currentUser?.email?:""
            repository?.saveProfile(UserProfile(name,role,org,country,email,alerts)){result->status=if(result.isSuccess)"Profile synchronized." else result.exceptionOrNull()?.localizedMessage?:"Save failed."}
        },Modifier.fillMaxWidth().height(54.dp)){Text("Save Profile")};OutlinedButton({FirebaseAuth.getInstance().currentUser?.email?.let{FirebaseAuth.getInstance().sendPasswordResetEmail(it)}},Modifier.fillMaxWidth()){Text("Reset Password")};OutlinedButton(signedOut,Modifier.fillMaxWidth(),colors=ButtonDefaults.outlinedButtonColors(contentColor=Color(0xFFFF5D6C))){Text("Log Out")}}
    }
}

@Composable private fun AnalysisCard(record:AnalysisRecord){MedicalCard(Modifier.fillMaxWidth()){Text(record.fileName.ifBlank{record.reportType},fontWeight=FontWeight.Bold);if(record.fileName.isNotBlank())Text(record.reportType,color=Muted);Text(record.summary,color=Muted);Text(record.status,color=Teal)}}
@Composable private fun ReportsScreen(records:List<AnalysisRecord>){LazyColumn(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){item{ScreenTitle("Analysis Reports","Synchronized with the web app")};if(records.isEmpty())item{MedicalCard(Modifier.fillMaxWidth()){Text("No matching analyses are available.",color=Muted)}}else items(records,key={it.id}){AnalysisCard(it)}}}
@Composable private fun InsightsScreen(records:List<AnalysisRecord>){LazyColumn(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){item{ScreenTitle("Health Trends","Local findings, comparisons, and recommendations")};if(records.size<2)item{MedicalCard(Modifier.fillMaxWidth()){Text("Metric comparison",fontWeight=FontWeight.Bold);Text("Add at least two reports to compare metric changes.",color=Muted)}};items(records,key={it.id}){record->MedicalCard(Modifier.fillMaxWidth()){Text(record.fileName.ifBlank{record.reportType},fontSize=20.sp,fontWeight=FontWeight.Bold);Text("Completed",color=Teal);Text("Findings",color=Teal,fontWeight=FontWeight.Bold);record.findings.forEach{Text("• $it",color=Muted)};Text("Recommendations",color=Teal,fontWeight=FontWeight.Bold);record.recommendations.forEach{Text("• $it",color=Muted)}}}}}
