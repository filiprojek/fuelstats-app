import 'package:flutter/material.dart';

class AddScreen extends StatefulWidget {
  @override
  _AddScreenState createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  final _formKey = GlobalKey<FormState>();

  String? _selectedVehicle;
  String? _selectedFuelType;
  final TextEditingController _litersController = TextEditingController();
  final TextEditingController _pricePerLiterController =
      TextEditingController();
  final TextEditingController _totalPriceController = TextEditingController();
  final TextEditingController _mileageController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  final List<String> _vehicles = ['Car A', 'Car B', 'Car C'];
  final List<String> _fuelTypes = ['Gasoline', 'Diesel', 'Electric'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  decoration: InputDecoration(labelText: 'Vehicle'),
                  value: _selectedVehicle,
                  items:
                      _vehicles.map((vehicle) {
                        return DropdownMenuItem(
                          value: vehicle,
                          child: Text(vehicle),
                        );
                      }).toList(),
                  onChanged:
                      (value) => setState(() => _selectedVehicle = value),
                  validator:
                      (value) =>
                          value == null ? 'Please select a vehicle' : null,
                ),
                SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  decoration: InputDecoration(labelText: 'Fuel Type'),
                  value: _selectedFuelType,
                  items:
                      _fuelTypes.map((fuel) {
                        return DropdownMenuItem(value: fuel, child: Text(fuel));
                      }).toList(),
                  onChanged:
                      (value) => setState(() => _selectedFuelType = value),
                  validator:
                      (value) =>
                          value == null ? 'Please select a fuel type' : null,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _litersController,
                  decoration: InputDecoration(labelText: 'Liters'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _pricePerLiterController,
                  decoration: InputDecoration(labelText: 'Price per Liter'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _totalPriceController,
                  decoration: InputDecoration(labelText: 'Total Price'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _mileageController,
                  decoration: InputDecoration(labelText: 'Mileage'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _noteController,
                  decoration: InputDecoration(labelText: 'Note'),
                  keyboardType: TextInputType.text,
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green, // green confirm button
                  ),
                  child: Text('Create Fuel Record'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String? _numberValidator(String? value) {
    if (value == null || value.isEmpty) return 'This field cannot be empty';
    if (double.tryParse(value) == null) return 'Enter a valid number';
    return null;
  }

  void _submitForm() {
    if (_formKey.currentState?.validate() ?? false) {
      // Here you would save the form data to database or state
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fuel record created successfully!')),
      );
    }
  }
}
