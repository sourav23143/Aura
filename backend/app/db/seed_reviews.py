"""
AuraAI — Comprehensive Demo Review Seeder
Generates realistic e-commerce reviews for ALL products with pre-computed sentiment labels.
Covers all 10 product categories with varied review templates, ratings, and sentiments.
"""

import logging
import random
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Review

logger = logging.getLogger(__name__)

# ─── Reviewer personas (realistic school/edu emails) ───
REVIEWER_FIRSTNAMES = [
    "sarah", "raj", "mary", "john", "priya", "david", "anita", "james",
    "fatima", "chen", "olivia", "marcus", "aisha", "tom", "lakshmi",
    "robert", "meera", "alex", "deepa", "michael", "sunita", "william",
    "kavita", "daniel", "neha", "chris", "pooja", "brian", "ritu", "kevin",
    "shalini", "steve", "asha", "peter", "divya", "mark", "rekha", "paul",
    "sneha", "george", "preeti", "frank", "anjali", "neil", "swati", "sam",
    "nisha", "ryan", "tara", "adam",
]

REVIEWER_ROLES = [
    "teacher", "admin", "principal", "it.head", "lab.director",
    "stem.coach", "tech.lead", "coordinator", "facilities", "dept.head",
    "librarian", "prof", "hod", "vp.academics", "procurement",
    "it.support", "science.head", "cs.teacher", "math.dept", "finance",
]

REVIEWER_DOMAINS = [
    "school.edu", "academy.in", "highschool.org", "publicschool.org",
    "montessori.edu", "techschool.edu", "greenfield.edu", "charter.org",
    "innovation.edu", "westside.org", "central.edu", "rural.school.org",
    "districtk12.org", "dav.edu.in", "kv.school.in", "ips.academy.edu",
    "stmarys.edu", "dps.school.in", "presidency.edu", "cambridge.school.org",
    "ryan.edu.in", "amity.edu", "vibgyor.school.in", "podar.edu",
    "city.school.org", "global.academy.edu", "sunrise.school.in",
    "heritage.edu", "modern.school.org", "national.academy.edu",
]


def _generate_email(seed_val: int) -> str:
    """Deterministic but realistic email from a seed."""
    rng = random.Random(seed_val)
    first = rng.choice(REVIEWER_FIRSTNAMES)
    role = rng.choice(REVIEWER_ROLES)
    domain = rng.choice(REVIEWER_DOMAINS)
    return f"{role}.{first}@{domain}"


# ─── Category-specific review templates ───
# Each entry: (content, sentiment, rating_range, score_range)

REVIEW_TEMPLATES = {
    "Smart Classrooms": {
        "POSITIVE": [
            ("Absolutely fantastic display! The touch response is incredibly smooth and the 4K resolution makes diagrams crystal clear. Our students are far more engaged during lessons now.", (4, 5), (0.92, 0.99)),
            ("Best interactive display we've purchased. The built-in whiteboard software is intuitive and teachers picked it up within minutes. Great value for money.", (4, 5), (0.90, 0.97)),
            ("Excellent product! The anti-glare screen works perfectly even in bright classrooms. Students can see clearly from every angle. Highly recommended for schools.", (5, 5), (0.93, 0.98)),
            ("We installed 12 of these across our campus and every teacher loves them. The multi-touch feature makes collaborative lessons so much more interactive.", (4, 5), (0.91, 0.96)),
            ("The display quality is outstanding. Colors are vivid, the screen is responsive, and the integrated speakers are surprisingly powerful. Perfect for presentations.", (4, 5), (0.89, 0.95)),
            ("Great upgrade from our old projectors. The brightness and clarity are night and day different. Students are more attentive and participation has increased significantly.", (4, 5), (0.88, 0.94)),
            ("Installation was quick and the display was up and running in under an hour. The HDMI and USB-C connectivity options make it versatile for any device.", (4, 5), (0.87, 0.93)),
            ("Our teachers gave this a 9/10 rating in our internal survey. The annotation tools are fantastic for math and science classes. Would definitely buy again.", (4, 5), (0.90, 0.96)),
            ("The screen clarity is exceptional. Even students at the back of a 40-student classroom can read text clearly. The zoom feature is particularly useful.", (5, 5), (0.91, 0.97)),
            ("Wonderful product that has transformed our teaching methodology. The screen sharing capability allows students to present their work seamlessly.", (4, 5), (0.88, 0.95)),
        ],
        "NEGATIVE": [
            ("This product arrived completely broken! The screen had visible cracks and the touch sensor stopped working after two days. I demand a refund immediately.", (1, 1), (0.94, 0.99)),
            ("Terrible quality. The display started flickering after just one week of use. Customer support took 3 weeks to respond and still hasn't resolved the issue.", (1, 2), (0.91, 0.97)),
            ("Very disappointed. The touch accuracy is terrible - you have to press really hard and it still misses inputs. Not suitable for classroom use at all.", (1, 2), (0.89, 0.96)),
            ("The screen developed dead pixels within the first month. For a product at this price point, the quality control is unacceptable.", (1, 2), (0.90, 0.95)),
            ("Overpriced and underperforming. The built-in software crashes frequently and the display overheats after 2 hours of continuous use. Very frustrating.", (1, 2), (0.88, 0.94)),
            ("The viewing angles are terrible despite claims otherwise. Students sitting on the sides can barely read the content. False advertising.", (2, 2), (0.87, 0.93)),
            ("Worst purchase decision we made. The firmware update bricked two of our displays and tech support was completely unhelpful.", (1, 1), (0.93, 0.98)),
        ],
        "NEUTRAL": [
            ("Decent display for the price. Nothing extraordinary but gets the job done. The software could use some updates but overall acceptable.", (3, 3), (0.50, 0.65)),
            ("Average quality. The display works fine for basic presentations but the touch response could be better. Some features feel half-baked.", (3, 3), (0.48, 0.62)),
            ("It works as expected, nothing more nothing less. The setup was straightforward but the user manual could be more detailed.", (3, 3), (0.50, 0.60)),
        ],
    },

    "Robotics & STEM": {
        "POSITIVE": [
            ("The robotics lab kit is outstanding! Students built their first autonomous robot in just two class periods. The curriculum guides are very well structured.", (4, 5), (0.92, 0.98)),
            ("Amazing STEM kit. Our students won the regional robotics competition after training with this system. The sensor variety is impressive.", (5, 5), (0.94, 0.99)),
            ("Best investment we made for our STEM lab. The modular design allows students to start simple and progressively build complex robots. Brilliant pedagogical approach.", (4, 5), (0.90, 0.97)),
            ("The coding interface is perfect for beginners. Students as young as 10 years old are programming robots successfully. Great for building computational thinking.", (4, 5), (0.89, 0.95)),
            ("Excellent build quality. After two years of heavy student use, the components are still working perfectly. The replacement parts are also reasonably priced.", (4, 5), (0.88, 0.94)),
            ("Our STEM program enrollment increased by 60% after we introduced this robotics lab. Students are excited about engineering and technology like never before.", (5, 5), (0.93, 0.98)),
            ("The teacher training materials are comprehensive. Even our non-technical staff could facilitate robotics sessions confidently after the orientation.", (4, 5), (0.87, 0.93)),
            ("Love the integration with Python and block-based coding. Students can transition from visual programming to text-based coding seamlessly.", (4, 5), (0.91, 0.96)),
            ("The wireless connectivity makes classroom management so much easier. Teachers can monitor all robot stations from a single dashboard.", (4, 5), (0.88, 0.95)),
        ],
        "NEGATIVE": [
            ("Very disappointing experience. Half the sensors were missing from the box and the software failed to install on our school computers. Poor quality control.", (1, 2), (0.91, 0.97)),
            ("The robot motors burned out after just a few uses. The build quality is far below what we expected from this price range. Complete waste of money.", (1, 1), (0.93, 0.98)),
            ("Software compatibility issues with Windows 11. The app crashes constantly and we've lost student projects multiple times. Extremely frustrating.", (1, 2), (0.89, 0.95)),
            ("The documentation is awful. It took our experienced IT team two full days to set up the lab. The instructions are outdated and full of errors.", (2, 2), (0.87, 0.94)),
            ("Overpriced for what you get. Similar kits from competitors offer better components at half the price. Will not be renewing our order.", (1, 2), (0.88, 0.93)),
            ("The Bluetooth connectivity drops every few minutes, making it impossible for students to complete their projects without constant reconnection.", (1, 2), (0.90, 0.96)),
        ],
        "NEUTRAL": [
            ("The kit is decent but nothing extraordinary. Some components feel cheap. Works fine for basic demonstrations but wouldn't rely on it for advanced projects.", (3, 3), (0.50, 0.62)),
            ("Adequate for introductory robotics classes. The more advanced features require additional purchases which weren't mentioned upfront.", (3, 3), (0.48, 0.58)),
            ("Mixed feelings. The hardware is good but the software needs significant improvements. The robot performs well but programming interface is clunky.", (3, 3), (0.50, 0.60)),
        ],
    },

    "Software & ERP": {
        "POSITIVE": [
            ("Best ERP we've ever used. The attendance module alone saved us 10 hours a week. Love the real-time parent communication portal. Highly recommend for any school.", (5, 5), (0.94, 0.99)),
            ("The fee management system is incredibly efficient. We went from 3 days of manual processing to automated collection with real-time tracking. Game changer.", (4, 5), (0.92, 0.97)),
            ("Excellent software with a modern, intuitive interface. Staff training took only 2 hours. The gradebook and report card generation is phenomenal.", (4, 5), (0.90, 0.96)),
            ("The parent app is a huge hit. Parents love getting instant notifications about attendance, grades, and school events. It has dramatically reduced phone inquiries.", (4, 5), (0.89, 0.95)),
            ("Comprehensive ERP that covers everything from admissions to alumni management. The analytics dashboard gives us insights we never had before.", (5, 5), (0.93, 0.98)),
            ("The timetable scheduling module is brilliant. What used to take our coordinator 2 weeks now takes 2 hours. Highly optimized algorithm.", (4, 5), (0.91, 0.97)),
            ("Cloud-based architecture means we can access everything from anywhere. The uptime has been 99.9% over the past year. Very reliable.", (4, 5), (0.88, 0.94)),
            ("The API integrations with our existing systems were seamless. The technical team was very supportive during the migration process.", (4, 5), (0.87, 0.93)),
        ],
        "NEGATIVE": [
            ("Terrible software. The billing module crashed during our fee collection period and we lost two days of transaction data. Customer support was completely useless.", (1, 1), (0.94, 0.99)),
            ("The system is painfully slow. Loading a simple student report takes 30+ seconds. With 2000 students, this is absolutely unacceptable.", (1, 2), (0.91, 0.97)),
            ("Data migration was a nightmare. We lost historical records during the import and the support team blamed our data format. Very unprofessional.", (1, 2), (0.89, 0.95)),
            ("The mobile app is buggy and crashes frequently. Parents are complaining daily. This is embarrassing for our school's reputation.", (1, 2), (0.90, 0.96)),
            ("Hidden costs everywhere. The base package is useless without add-ons that double the price. Very deceptive pricing strategy.", (2, 2), (0.88, 0.94)),
            ("The exam module couldn't handle more than 500 concurrent users during our final exams. The entire system went down for 4 hours. Unforgivable.", (1, 1), (0.93, 0.98)),
            ("Poor data security practices. We found that student data was being stored in plain text. Absolutely unacceptable for a school ERP.", (1, 1), (0.92, 0.97)),
        ],
        "NEUTRAL": [
            ("The software does what it promises, but the interface feels dated compared to modern alternatives. Functional but not inspiring.", (3, 3), (0.50, 0.62)),
            ("Average ERP system. Some modules work great while others need significant improvement. The attendance module is good but HR is weak.", (3, 3), (0.48, 0.60)),
            ("Works for a small school but struggles with scale. If you have under 500 students, it's fine. Beyond that, look elsewhere.", (3, 3), (0.50, 0.58)),
        ],
    },

    "Digital Content": {
        "POSITIVE": [
            ("The AR biology lab has revolutionized how we teach anatomy. Students can explore 3D organs in augmented reality. Engagement has skyrocketed!", (5, 5), (0.94, 0.99)),
            ("Incredible educational content. The virtual dissection module replaced our need for physical specimens while providing a better learning experience.", (4, 5), (0.91, 0.97)),
            ("Students absolutely love the interactive 3D models. The heart circulatory system visualization alone made this purchase worthwhile. Outstanding!", (5, 5), (0.93, 0.98)),
            ("The AR markers work flawlessly with both tablets and phones. Students can explore at their own pace. The quiz integration reinforces learning beautifully.", (4, 5), (0.90, 0.96)),
            ("This virtual lab has enabled us to teach advanced biology concepts that were impossible with traditional methods. The molecular biology module is exceptional.", (4, 5), (0.89, 0.95)),
            ("The content depth is impressive. From cellular structures to organ systems, everything is covered with medical-grade accuracy. Perfect for grades 8-12.", (4, 5), (0.88, 0.94)),
            ("Our biology scores improved by 23% after implementing this AR lab. The interactive visualizations help students understand complex concepts intuitively.", (5, 5), (0.92, 0.97)),
            ("Teacher controls are excellent. We can assign specific modules, track student progress, and generate analytics reports effortlessly.", (4, 5), (0.87, 0.93)),
        ],
        "NEGATIVE": [
            ("The AR tracking is terrible. The virtual models keep jumping around and students get frustrated trying to interact with them. Needs major improvement.", (1, 2), (0.90, 0.96)),
            ("Content is outdated. Several anatomical labels are incorrect and the latest curriculum changes haven't been incorporated. Very disappointing.", (1, 2), (0.89, 0.95)),
            ("Requires expensive tablets to run smoothly. On our budget Android devices, the app is laggy and crashes frequently. Not practical for most schools.", (1, 2), (0.88, 0.94)),
            ("The subscription model is predatory. Content we purchased last year is now locked behind a higher tier. This is not how educational software should work.", (1, 2), (0.91, 0.97)),
            ("Very limited content for chemistry and physics despite being advertised as a comprehensive science lab. Biology is decent but everything else is superficial.", (2, 2), (0.87, 0.93)),
        ],
        "NEUTRAL": [
            ("The concept is great but execution needs work. Some AR modules are excellent while others feel rushed. Hoping for updates to fill the gaps.", (3, 3), (0.50, 0.62)),
            ("Useful supplementary tool but not a replacement for hands-on lab work. Good for visual learners but limited interactivity in some modules.", (3, 3), (0.48, 0.58)),
            ("Mixed experience. Works well on newer devices but older tablets struggle. Content quality varies significantly between modules.", (3, 3), (0.50, 0.60)),
        ],
    },

    "School Software": {
        "POSITIVE": [
            ("The language lab software has transformed our English classes. The pronunciation analysis feature gives students instant feedback that was impossible before.", (4, 5), (0.91, 0.97)),
            ("Excellent phonics software. The speech recognition accurately identifies pronunciation errors and provides targeted exercises. Students love the gamified approach.", (5, 5), (0.93, 0.98)),
            ("Our language proficiency scores improved by 35% within one semester. The adaptive learning algorithm adjusts difficulty perfectly for each student.", (4, 5), (0.90, 0.96)),
            ("The multilingual support is outstanding. We use it for English, Hindi, and French classes. The content library is extensive and well-organized.", (4, 5), (0.89, 0.95)),
            ("Great software for developing listening and speaking skills. The conversation simulation module prepares students for real-world language use.", (4, 5), (0.88, 0.94)),
            ("The teacher dashboard provides detailed analytics on each student's progress. We can identify struggling students early and provide targeted support.", (4, 5), (0.87, 0.93)),
            ("Best language learning software we've tried. The interactive stories and role-playing modules keep students engaged throughout the session.", (5, 5), (0.92, 0.97)),
            ("Recording and playback features are excellent for self-assessment. Students can compare their pronunciation with native speaker models.", (4, 5), (0.88, 0.95)),
        ],
        "NEGATIVE": [
            ("The speech recognition is inaccurate for non-native English speakers. It marks correct pronunciations as wrong, discouraging students.", (1, 2), (0.90, 0.96)),
            ("Terrible user experience. The interface is confusing even for tech-savvy teachers. Students waste half the class time navigating menus.", (1, 2), (0.89, 0.95)),
            ("The software requires constant internet connectivity. In our rural school with limited bandwidth, it's practically unusable. Very poorly designed.", (1, 2), (0.88, 0.94)),
            ("Content is heavily biased towards American English. No options for British English or regional accents. Very limiting for international schools.", (2, 2), (0.87, 0.93)),
            ("The license management is a nightmare. We constantly run into seat limit issues even though we purchased enough licenses. Support is unresponsive.", (1, 2), (0.91, 0.97)),
            ("Audio quality from the built-in microphones is captured poorly. The noise cancellation doesn't work in real classroom environments.", (2, 2), (0.86, 0.92)),
        ],
        "NEUTRAL": [
            ("The software is functional but feels outdated. The content is acceptable but the UI needs a major refresh to appeal to today's students.", (3, 3), (0.50, 0.62)),
            ("Works well for elementary level but lacks depth for middle and high school language learning. Good starting point but needs expansion.", (3, 3), (0.48, 0.58)),
            ("Some modules are excellent while others are mediocre. The phonics section is strong but the grammar modules are just glorified worksheets.", (3, 3), (0.50, 0.60)),
        ],
    },

    "Library & Admin": {
        "POSITIVE": [
            ("The library management system has streamlined our entire circulation process. What used to take 15 minutes per checkout now takes seconds with barcode scanning.", (4, 5), (0.91, 0.97)),
            ("Excellent kiosk system. Students can search, reserve, and check out books independently. Our librarian can now focus on curation rather than transactions.", (5, 5), (0.93, 0.98)),
            ("The OPAC search is incredibly fast and accurate. Students find books in seconds. The recommendation engine suggests relevant titles based on reading history.", (4, 5), (0.90, 0.96)),
            ("Overdue notifications are automated and parents appreciate the timely reminders. We've seen a 70% reduction in lost books since implementation.", (4, 5), (0.89, 0.95)),
            ("The inventory management module saved us during our annual audit. Complete cataloging with location tracking made the process effortless.", (4, 5), (0.88, 0.94)),
            ("The analytics dashboard shows reading trends, popular genres, and usage patterns. This data has been invaluable for our book procurement decisions.", (4, 5), (0.87, 0.93)),
            ("Integration with our school ERP was seamless. Student data syncs automatically so no duplicate data entry is needed.", (4, 5), (0.90, 0.96)),
            ("The e-book integration allows students to access digital resources from home. The built-in reader with annotation support is a nice touch.", (4, 5), (0.88, 0.95)),
        ],
        "NEGATIVE": [
            ("The barcode scanner compatibility is terrible. We had to buy specific scanners that cost extra. The advertised 'universal compatibility' is false.", (1, 2), (0.90, 0.96)),
            ("System crashes when more than 10 students use the kiosk simultaneously. During library hour, this means long queues and frustrated students.", (1, 2), (0.89, 0.95)),
            ("The cataloging system uses an outdated classification scheme. Importing our existing MARC records was a painful process with constant errors.", (2, 2), (0.88, 0.94)),
            ("The touchscreen kiosk hardware is cheap and stopped responding after a few months. The warranty process was extremely slow and unhelpful.", (1, 2), (0.91, 0.97)),
            ("Cannot handle our library of 50,000+ books. The search becomes painfully slow with large catalogs. Clearly designed only for small libraries.", (1, 2), (0.87, 0.93)),
        ],
        "NEUTRAL": [
            ("Adequate for a small school library but limited in features compared to professional library management systems. Does the basics well enough.", (3, 3), (0.50, 0.62)),
            ("The hardware is decent but the software needs more polish. Functional for day-to-day operations but reporting capabilities are limited.", (3, 3), (0.48, 0.58)),
            ("Works as expected for basic library operations. Nothing innovative but reliable enough. Would appreciate more customization options.", (3, 3), (0.50, 0.60)),
        ],
    },

    "3D & Maker Lab": {
        "POSITIVE": [
            ("Amazing 3D printing setup! Print quality is excellent and the slicing software is very intuitive. Students are printing functional prototypes within their first week.", (5, 5), (0.93, 0.98)),
            ("The dual-extruder system allows multi-material prints that look professional. Our engineering students have created incredible capstone projects.", (4, 5), (0.91, 0.97)),
            ("Excellent for STEM education. Students learn CAD design and see their creations come to life. The heated bed ensures prints stick perfectly every time.", (4, 5), (0.90, 0.96)),
            ("The enclosed print chamber is essential for a school environment. Safety features are well-thought-out and the air filtration system works great.", (4, 5), (0.89, 0.95)),
            ("We run this printer 8 hours a day during school hours and it has been incredibly reliable. Maintenance is minimal and replacement parts are affordable.", (4, 5), (0.88, 0.94)),
            ("The curriculum integration is excellent. The included lesson plans cover physics, mathematics, engineering, and art applications of 3D printing.", (4, 5), (0.87, 0.93)),
            ("Print speed is impressive for the quality level. Large projects that would take 12 hours on other printers complete in 6-7 hours here.", (4, 5), (0.90, 0.96)),
            ("The WiFi connectivity and cloud print queue management make it easy for multiple classrooms to share a single printer station.", (4, 5), (0.88, 0.95)),
        ],
        "NEGATIVE": [
            ("The printer nozzle clogged on the very first print. The filament quality is awful and the build plate never levels properly. Waste of money, would never buy again.", (1, 1), (0.94, 0.99)),
            ("Constant bed adhesion problems. Prints warp and detach halfway through. We've wasted kilograms of filament on failed prints.", (1, 2), (0.91, 0.97)),
            ("The slicer software is buggy and crashes when importing complex STL files. Students lose their work regularly. Extremely frustrating experience.", (1, 2), (0.89, 0.95)),
            ("Fire safety concern! The heating element reached temperatures way above specifications. We had to disconnect it immediately. Dangerous for a school setting.", (1, 1), (0.93, 0.98)),
            ("The claimed print resolution is nowhere close to reality. Layer lines are clearly visible even at the finest setting. Marketing is misleading.", (2, 2), (0.88, 0.94)),
            ("Filament feed mechanism is poorly designed. It strips the filament regularly, causing mid-print failures. Design flaw that needs a recall.", (1, 2), (0.90, 0.96)),
        ],
        "NEUTRAL": [
            ("Decent entry-level 3D printer for schools. Print quality is acceptable for educational purposes but don't expect professional-grade results.", (3, 3), (0.50, 0.62)),
            ("The printer works fine for small projects but struggles with anything over 6 inches. Fine for demonstrations but limited for serious maker education.", (3, 3), (0.48, 0.58)),
            ("Average performance. Some prints come out great while others fail for no apparent reason. Consistency could be much better.", (3, 3), (0.50, 0.60)),
        ],
    },

    "VR & Simulation": {
        "POSITIVE": [
            ("Incredible tool for teaching physics! Students can visualize electromagnetic fields and gravitational waves in 3D. Engagement scores went up 40% this semester.", (5, 5), (0.94, 0.99)),
            ("The VR physics simulator is phenomenal. Students experience zero-gravity, observe atomic structures, and manipulate wave functions. Learning by immersion!", (5, 5), (0.93, 0.98)),
            ("Our students' understanding of abstract physics concepts improved dramatically. The real-time simulation of experiments is both accurate and visually stunning.", (4, 5), (0.91, 0.97)),
            ("The multiplayer lab mode allows students to collaborate on experiments in virtual space. Group work has never been this engaging.", (4, 5), (0.90, 0.96)),
            ("Excellent safety advantage. Students can safely experiment with high-voltage circuits, radioactive materials, and extreme temperatures in VR.", (4, 5), (0.89, 0.95)),
            ("The haptic feedback controllers add an incredible layer of realism. Students can feel resistance when stretching virtual springs. Brilliant engineering.", (4, 5), (0.88, 0.94)),
            ("Regular content updates keep the simulations current with the latest curriculum. The physics engine is remarkably accurate for educational purposes.", (4, 5), (0.87, 0.93)),
            ("The classroom management system for VR sessions is well-designed. Teachers can guide students, freeze simulations for discussion, and review recordings.", (4, 5), (0.90, 0.96)),
        ],
        "NEGATIVE": [
            ("Horrible experience. The VR headsets gave multiple students motion sickness and the software crashed constantly. Completely unusable in a classroom setting.", (1, 1), (0.93, 0.98)),
            ("The headsets are uncomfortable for students wearing glasses. After 20 minutes, students complain of headaches. Not designed with real users in mind.", (1, 2), (0.90, 0.96)),
            ("Extremely demanding hardware requirements. Our school computers can't run the simulations smoothly. They should have mentioned the GPU requirements upfront.", (1, 2), (0.89, 0.95)),
            ("The VR tracking loses calibration every few minutes. Students end up floating through walls and objects. Breaks the immersion completely.", (2, 2), (0.88, 0.94)),
            ("Battery life on the wireless headsets is only 45 minutes. With 1-hour class periods, students lose their progress midway. Terrible design decision.", (1, 2), (0.91, 0.97)),
            ("The hygiene aspect is concerning. Shared headsets in a school environment need better sanitization solutions. The foam padding absorbs sweat and is difficult to clean.", (2, 2), (0.87, 0.93)),
        ],
        "NEUTRAL": [
            ("The simulations look good but the hardware requirements are too demanding for our existing lab computers. Works on some machines, not on others.", (3, 3), (0.50, 0.62)),
            ("Interesting concept but needs more content. Currently only covers mechanics and optics. Would be great if they added thermodynamics and modern physics.", (3, 3), (0.48, 0.58)),
            ("The VR experience is impressive but the setup and teardown time for each class eats into teaching time. Needs a more streamlined workflow.", (3, 3), (0.50, 0.60)),
        ],
    },

    "AI & Data Science": {
        "POSITIVE": [
            ("The AI curriculum bundle is exactly what we needed. Students learn Python, machine learning basics, and data visualization in an engaging, project-based format.", (5, 5), (0.94, 0.99)),
            ("Outstanding curriculum. Our CS students built their first neural network by week 4. The progression from basics to advanced topics is perfectly paced.", (4, 5), (0.92, 0.98)),
            ("The Jupyter notebook integration makes hands-on coding seamless. Students can experiment with real datasets and see results immediately.", (4, 5), (0.91, 0.97)),
            ("Love the ethical AI module. Students learn about bias, fairness, and responsible AI development. This is crucial for the next generation of engineers.", (4, 5), (0.90, 0.96)),
            ("The pre-built datasets covering Indian demographics, climate data, and cricket statistics make learning relatable and fun for our students.", (4, 5), (0.89, 0.95)),
            ("Excellent teacher resources. Even with limited AI background, I was able to teach the course confidently using the detailed lesson plans and video guides.", (4, 5), (0.88, 0.94)),
            ("The cloud computing credits included are generous. Students can train models without worrying about local hardware limitations.", (4, 5), (0.87, 0.93)),
            ("Our students won a national hackathon using skills learned from this curriculum. The real-world project approach gives them a genuine competitive edge.", (5, 5), (0.93, 0.98)),
        ],
        "NEGATIVE": [
            ("The content assumes too much prior programming knowledge. Our beginners were completely lost by week 2. Not suitable for introductory classes.", (1, 2), (0.90, 0.96)),
            ("The cloud platform went down during our mid-term projects. Students lost their work and there was no backup solution. Extremely unreliable.", (1, 1), (0.93, 0.98)),
            ("The curriculum is already outdated. It still teaches TensorFlow 1.x when the industry has moved to TensorFlow 2 and PyTorch. Needs urgent updates.", (2, 2), (0.89, 0.95)),
            ("License restrictions prevent students from continuing projects at home. The limited school-only access defeats the purpose of self-paced learning.", (1, 2), (0.88, 0.94)),
            ("The difficulty spike between modules is extreme. Module 3 to Module 4 feels like jumping from high school to PhD level. No transition support.", (2, 2), (0.87, 0.93)),
            ("Assessment tools are primitive. Auto-grading only checks for exact output matches, not understanding. Students game the system easily.", (2, 2), (0.86, 0.92)),
        ],
        "NEUTRAL": [
            ("Good starting point for AI education but needs supplementary materials for advanced topics. The basics are well-covered but depth is lacking.", (3, 3), (0.50, 0.62)),
            ("The curriculum covers breadth but not depth. Students get exposed to many concepts but don't master any. Could benefit from specialization tracks.", (3, 3), (0.48, 0.58)),
            ("Acceptable for introducing AI concepts. The hands-on projects are decent but the theoretical explanations could be more rigorous.", (3, 3), (0.50, 0.60)),
        ],
    },

    "Furniture & Infrastructure": {
        "POSITIVE": [
            ("The ergonomic furniture has been a game-changer. Students report less back pain and the modular design makes rearranging classrooms for group work effortless.", (5, 5), (0.93, 0.98)),
            ("Excellent quality furniture. The adjustable height feature accommodates students from grade 1 to grade 12. Great long-term investment.", (4, 5), (0.91, 0.97)),
            ("The anti-microbial coating is perfect for a school environment. Easy to clean and maintains its appearance even after heavy use.", (4, 5), (0.90, 0.96)),
            ("Students love the collaborative desk configurations. The quick-lock mechanism allows switching between individual and group layouts in seconds.", (4, 5), (0.89, 0.95)),
            ("The storage integration is clever. Each desk has built-in compartments for books and devices, keeping the classroom organized and clutter-free.", (4, 5), (0.88, 0.94)),
            ("We replaced all 500 desks across our campus and the transformation is visible. Classrooms look modern, professional, and students take better care of the furniture.", (4, 5), (0.87, 0.93)),
            ("The wheelchair-accessible design options are well-thought-out. Our inclusive education setup looks seamless and dignified. Very thoughtful design.", (5, 5), (0.92, 0.97)),
            ("Installation was quick. The team set up 30 classrooms in just 3 days. The modular panels snap together without any tools needed.", (4, 5), (0.88, 0.95)),
        ],
        "NEGATIVE": [
            ("Chairs started wobbling after just one month of use. The height adjustment mechanism is broken on 3 out of 10 units. Build quality is far below expectations.", (1, 2), (0.91, 0.97)),
            ("The desk surfaces are scratching easily. After one semester, they look years old. The material quality is terrible for the premium price we paid.", (1, 2), (0.90, 0.96)),
            ("The assembly instructions were incomprehensible. We had to hire a carpenter separately. The 'easy assembly' claim is completely false.", (2, 2), (0.89, 0.95)),
            ("Chairs are extremely uncomfortable for extended periods. Students complain of back pain after sitting for more than 30 minutes. Ergonomic design is questionable.", (1, 2), (0.88, 0.94)),
            ("The folding mechanism on the collaborative tables pinched a student's finger. This is a serious safety hazard. We had to remove them from classrooms.", (1, 1), (0.93, 0.98)),
            ("Color fading is severe. The vibrant colors we ordered have turned dull within months. Looks terrible now and gives a poor impression to visiting parents.", (2, 2), (0.87, 0.93)),
        ],
        "NEUTRAL": [
            ("Standard school furniture at a standard price. Nothing special about the ergonomics but it's sturdy enough for daily use. Average quality overall.", (3, 3), (0.50, 0.62)),
            ("The chairs are comfortable but the desks feel cramped. Adequate for younger students but high schoolers need more workspace.", (3, 3), (0.48, 0.58)),
            ("Decent furniture that does the job. The modular concept is nice in theory but in practice, teachers rarely reconfigure the layout.", (3, 3), (0.50, 0.60)),
        ],
    },
}

# Map product categories from the seed data to our template categories
CATEGORY_MAP = {
    "Smart Classrooms": "Smart Classrooms",
    "Robotics & STEM": "Robotics & STEM",
    "Software & ERP": "Software & ERP",
    "Digital Content": "Digital Content",
    "School Software": "School Software",
    "Library & Admin": "Library & Admin",
    "3D & Maker Lab": "3D & Maker Lab",
    "VR & Simulation": "VR & Simulation",
    "AI & Data Science": "AI & Data Science",
    "Furniture & Infrastructure": "Furniture & Infrastructure",
}


# ─── Content variation modifiers to make reviews unique at scale ───

POSITIVE_OPENERS = [
    "", "After using this for 3 months, I can say: ", "We purchased this last semester and ",
    "As a school administrator, ", "Our department head recommended this and ",
    "After extensive research, we chose this product. ", "Second year using this. ",
    "Upgraded from a competitor's product. ", "Bought 5 units for our campus. ",
    "Our teachers unanimously approved this. ", "Following a pilot program, ",
    "We tested several options before choosing this. ", "Initially skeptical, but ",
    "Our board approved this purchase and ", "After reading many reviews, we decided to try it. ",
    "This is our third purchase from this brand. ", "We deployed this across 3 campuses. ",
    "Our IT committee evaluated this product. ", "Based on peer recommendations, ",
    "We switched from a different vendor and ", "Perfect timing for our NEP 2020 upgrades. ",
    "Purchased during the annual sale. ", "Our principal insisted on this product. ",
    "After a successful demo, we placed a bulk order. ", "Year-end review: ",
]

NEGATIVE_OPENERS = [
    "", "After just 2 weeks of use: ", "We regret this purchase. ",
    "Bought this based on misleading marketing. ", "Despite the high price, ",
    "Our experience has been terrible. ", "Warning to other schools: ",
    "We expected much better quality. ", "Complete letdown. ",
    "Returning this product immediately. ", "Our staff is extremely unhappy. ",
    "After multiple complaints from teachers, ", "We've filed a formal complaint. ",
    "Second unit we've received with the same issue. ", "Our IT team identified serious flaws. ",
    "We cannot recommend this product. ", "Buyer beware: ",
    "Despite assurances from the sales team, ", "We waited 3 months for a fix that never came. ",
    "Management is considering legal action. ", "Our procurement team feels deceived. ",
]

NEUTRAL_OPENERS = [
    "", "After a semester of use: ", "Mixed feelings about this one. ",
    "It's okay for the price. ", "Neither impressed nor disappointed. ",
    "Fair assessment after 3 months: ", "Balanced review here. ",
    "Our experience has been average. ", "Some pros and cons to share. ",
    "Honest feedback from our team: ", "Worth considering but not a clear winner. ",
    "For what it's worth: ", "Our department has mixed opinions. ",
]

CLOSING_PHRASES = [
    "", " Will update this review after more use.", " Hope the next version improves.",
    " Overall satisfied with the purchase.", " Would consider buying again.",
    " Time will tell if this holds up.", " Looking forward to software updates.",
    " The warranty gives us some peace of mind.", " Our students seem to like it.",
    " Compared to alternatives, this is decent.", " Price-to-value ratio is fair.",
    " Setup was handled by our IT team.", " Training was provided by the vendor.",
    " We got a good deal during the education discount period.",
    " The after-sales support has been responsive.", " Delivery was on time.",
    " We ordered additional units for next year.", " Our feedback was acknowledged by the team.",
    " Installation took about a day.", " The user manual could be more detailed.",
    " Compatible with our existing infrastructure.", " Works well in our climate conditions.",
    " The vendor provided on-site training.", " We've seen improvements in student engagement.",
    " Our teachers adapted quickly.", " The procurement process was smooth.",
]

TIME_REFERENCES = [
    "last semester", "3 months ago", "at the start of the academic year",
    "last quarter", "6 months ago", "during our summer upgrades",
    "in January", "after the annual audit", "during mid-term break",
    "last year", "two semesters ago", "recently", "a few weeks ago",
    "at the beginning of this term", "during our infrastructure overhaul",
]


def _vary_content(base_content: str, sentiment: str, rng: random.Random) -> str:
    """Add variation to a review template to make it unique."""
    if sentiment == "POSITIVE":
        opener = rng.choice(POSITIVE_OPENERS)
    elif sentiment == "NEGATIVE":
        opener = rng.choice(NEGATIVE_OPENERS)
    else:
        opener = rng.choice(NEUTRAL_OPENERS)

    # 40% chance to add a closing phrase
    closing = rng.choice(CLOSING_PHRASES) if rng.random() < 0.4 else ""

    # 25% chance to inject a time reference
    if rng.random() < 0.25:
        time_ref = rng.choice(TIME_REFERENCES)
        base_content = base_content.replace(".", f" (purchased {time_ref}).", 1)

    result = f"{opener}{base_content}{closing}".strip()
    return result


def _pick_reviews_for_product(product_id: str, category: str, rng: random.Random) -> list[dict]:
    """Generate a realistic set of 50-70 reviews for a single product."""
    templates = REVIEW_TEMPLATES.get(category)
    if not templates:
        # fallback: pick any category
        templates = rng.choice(list(REVIEW_TEMPLATES.values()))

    # Determine how many reviews this product gets (50-70, weighted toward 55-60)
    num_reviews = rng.choices(
        population=[50, 52, 54, 55, 56, 58, 60, 62, 65, 68, 70],
        weights=   [5,  8,  12, 15, 15, 14, 12, 8,  5,  4,  2],
        k=1
    )[0]

    # Realistic sentiment distribution: ~55% positive, ~25% negative, ~20% neutral
    sentiment_choices = rng.choices(
        population=["POSITIVE", "NEGATIVE", "NEUTRAL"],
        weights=[55, 25, 20],
        k=num_reviews,
    )

    reviews = []
    used_emails = set()
    used_contents = set()

    for i, sentiment in enumerate(sentiment_choices):
        pool = templates.get(sentiment, templates["POSITIVE"])
        template = rng.choice(pool)
        base_content, rating_range, score_range = template

        # Generate varied content
        content = _vary_content(base_content, sentiment, rng)
        # Ensure content uniqueness within this product (retry if duplicate)
        attempts = 0
        while content in used_contents and attempts < 5:
            content = _vary_content(base_content, sentiment, rng)
            attempts += 1
        used_contents.add(content)

        rating = rng.randint(rating_range[0], rating_range[1])
        score = round(rng.uniform(score_range[0], score_range[1]), 2)

        # Generate unique email per product
        seed_val = hash(f"{product_id}-{i}-{content[:30]}")
        email = _generate_email(seed_val)
        while email in used_emails:
            seed_val += 1
            email = _generate_email(seed_val)
        used_emails.add(email)

        reviews.append({
            "product_id": product_id,
            "user_email": email,
            "rating": rating,
            "content": content,
            "sentiment": sentiment,
            "sentiment_score": score,
        })

    return reviews


def generate_all_reviews(products: list[dict]) -> list[dict]:
    """
    Generate 50-70 reviews per product for ALL products.

    Args:
        products: list of {"id": str, "category": str}

    Returns:
        List of review dicts ready for DB insertion.
    """
    all_reviews = []
    rng = random.Random(42)  # Fixed seed for reproducibility

    for idx, product in enumerate(products):
        pid = product["id"]
        cat = product["category"]
        reviews = _pick_reviews_for_product(pid, cat, rng)
        all_reviews.extend(reviews)
        if (idx + 1) % 200 == 0:
            logger.info(f"  Generated reviews for {idx + 1}/{len(products)} products ({len(all_reviews)} total)...")

    return all_reviews


async def seed_demo_reviews(db: AsyncSession) -> dict:
    """
    Seed realistic demo reviews for ALL products (50-70 per product).
    Skips if reviews already exist.
    """
    from app.models import Document

    # Check if reviews already exist
    result = await db.execute(select(func.count(Review.id)))
    existing_count = result.scalar()

    if existing_count > 0:
        logger.info(f"Reviews already exist: {existing_count} reviews in DB - skipping seed")
        return {"review_count": existing_count, "newly_added": 0}

    # Load all products from DB
    result = await db.execute(select(Document.id, Document.category))
    products = [{"id": row[0], "category": row[1]} for row in result.all()]

    if not products:
        logger.warning("No products found in DB. Seed products first.")
        return {"review_count": 0, "newly_added": 0}

    logger.info(f"Generating 50-70 reviews each for {len(products)} products...")

    all_reviews = generate_all_reviews(products)
    logger.info(f"Generated {len(all_reviews)} reviews. Inserting into database in batches...")

    # Batch insert with larger batches for performance
    BATCH_SIZE = 500
    total_batches = (len(all_reviews) + BATCH_SIZE - 1) // BATCH_SIZE
    for batch_num, i in enumerate(range(0, len(all_reviews), BATCH_SIZE), 1):
        batch = all_reviews[i:i + BATCH_SIZE]
        for review_data in batch:
            review = Review(
                product_id=review_data["product_id"],
                user_email=review_data["user_email"],
                rating=review_data["rating"],
                content=review_data["content"],
                sentiment=review_data["sentiment"],
                sentiment_score=review_data["sentiment_score"],
            )
            db.add(review)
        await db.flush()
        if batch_num % 20 == 0:
            logger.info(f"  Inserted batch {batch_num}/{total_batches}...")

    await db.commit()
    logger.info(f"Seeded {len(all_reviews)} demo reviews across {len(products)} products")

    return {"review_count": len(all_reviews), "newly_added": len(all_reviews)}
